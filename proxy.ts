import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authCookieName, verifySessionCookieValue } from "@/lib/auth";

const PUBLIC_PATH_PREFIXES = ["/login", "/api/auth/login", "/api/auth/logout", "/marketing"];

// RoundMate's marketing site is the home page on every host (production,
// previews, localhost). "/archers" is the entry point into the private,
// single-shared-login scheduler app that used to live at "/".
const PATH_ALIASES: Record<string, string> = {
  "/": "/marketing",
  "/demo": "/marketing/demo",
  "/archers": "/schedule",
};

function isPublicPath(pathname: string) {
  return PUBLIC_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
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

  // Resolve the effective target path first, then run every auth/public
  // check against that target — never rewrite-and-return before the auth
  // check, or an alias like "/archers" would bypass login entirely.
  const target = PATH_ALIASES[pathname] ?? pathname;

  if (isPublicPath(target)) {
    if (target === pathname) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = target;
    return NextResponse.rewrite(url);
  }

  const cookie = req.cookies.get(authCookieName())?.value;
  const ok = await verifySessionCookieValue(cookie);
  if (ok) {
    if (target === pathname) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = target;
    return NextResponse.rewrite(url);
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  // Keep the alias (e.g. "/archers"), not the resolved target, so the
  // post-login redirect lands back on the friendly URL.
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
