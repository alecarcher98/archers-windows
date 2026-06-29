import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  adminCookieName,
  authCookieName,
  tenantCookieName,
  verifyAdminSessionCookieValue,
  verifySessionCookieValue,
} from "@/lib/auth";
import { resolveCompanyBySlug } from "@/lib/tenant";

const PUBLIC_PATH_PREFIXES = ["/login", "/api/auth/login", "/api/auth/logout", "/marketing"];
const ADMIN_PUBLIC_PATHS = ["/admin/login", "/api/admin/auth/login"];

// RoundMate's marketing site is the home page on every host (production,
// previews, localhost). "/demo" is its own alias. "/archers" and "/c/[slug]"
// are per-tenant entry points into the private scheduler app — resolved
// below, not in this map, since they need a DB lookup.
const PATH_ALIASES: Record<string, string> = {
  "/": "/marketing",
  "/demo": "/marketing/demo",
};

// "/archers" is a permanent legacy alias to the original tenant's slug —
// new tenants only ever get "/c/[slug]".
const LEGACY_ARCHERS_SLUG = "archers-windows";

function isPublicPath(pathname: string) {
  return PUBLIC_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Tenant entry points are exact-match only — "/c/[slug]" is a login
 * boundary, not a persistent URL namespace. Everything inside the app uses
 * today's flat paths (/schedule, /customers, ...), scoped by the session. */
function tenantSlugForPath(pathname: string): string | null {
  if (pathname === "/archers") return LEGACY_ARCHERS_SLUG;
  const match = /^\/c\/([^/]+)$/.exec(pathname);
  return match ? match[1] : null;
}

function tenantCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  // Admin is a fully separate gate from the tenant/company flow below —
  // its own cookie, its own login, never shares logic with company auth.
  if (pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/")) {
    if (ADMIN_PUBLIC_PATHS.includes(pathname)) {
      return NextResponse.next();
    }
    const adminCookie = req.cookies.get(adminCookieName())?.value;
    const isAdmin = await verifyAdminSessionCookieValue(adminCookie);
    if (isAdmin) return NextResponse.next();

    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const tenantSlug = tenantSlugForPath(pathname);
  if (tenantSlug) {
    const company = await resolveCompanyBySlug(tenantSlug);
    const cookie = req.cookies.get(authCookieName())?.value;
    const session = await verifySessionCookieValue(cookie);

    // Already signed in as exactly this tenant — go straight in. Otherwise
    // (no session, expired session, or a session for a *different* tenant)
    // always re-authenticate against the tenant named in the URL; never
    // silently reuse another tenant's session.
    if (company?.status === "active" && session?.role === "company" && session.companyId === company.id) {
      const url = req.nextUrl.clone();
      url.pathname = "/schedule";
      const res = NextResponse.rewrite(url);
      res.cookies.set(tenantCookieName(), tenantSlug, tenantCookieOptions());
      return res;
    }

    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("slug", tenantSlug);
    url.searchParams.set("next", "/schedule");
    const res = NextResponse.redirect(url);
    res.cookies.set(tenantCookieName(), tenantSlug, tenantCookieOptions());
    return res;
  }

  // Resolve the effective target path first, then run every auth/public
  // check against that target — never rewrite-and-return before the auth
  // check, or an alias would bypass login entirely.
  const target = PATH_ALIASES[pathname] ?? pathname;

  if (isPublicPath(target)) {
    if (target === pathname) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = target;
    return NextResponse.rewrite(url);
  }

  const cookie = req.cookies.get(authCookieName())?.value;
  const session = await verifySessionCookieValue(cookie);
  if (session?.role === "company") {
    if (target === pathname) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = target;
    return NextResponse.rewrite(url);
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
