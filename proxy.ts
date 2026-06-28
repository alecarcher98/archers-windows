import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authCookieName, verifySessionCookieValue } from "@/lib/auth";

const PUBLIC_PATH_PREFIXES = ["/login", "/api/auth/login", "/api/auth/logout", "/marketing"];

// getroundmate.co.uk gets clean URLs that map onto the isolated /marketing
// route segment. Every other host (the app's own domain, previews,
// localhost) is untouched and keeps redirecting "/" to "/schedule".
const MARKETING_HOSTS = new Set(["getroundmate.co.uk", "www.getroundmate.co.uk"]);
const MARKETING_HOST_ROUTES: Record<string, string> = {
  "/": "/marketing",
  "/demo": "/marketing/demo",
};

function isPublicPath(pathname: string) {
  return PUBLIC_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const host = req.headers.get("host")?.split(":")[0];
  if (host && MARKETING_HOSTS.has(host)) {
    const rewriteTo = MARKETING_HOST_ROUTES[pathname];
    if (rewriteTo) {
      const url = req.nextUrl.clone();
      url.pathname = rewriteTo;
      return NextResponse.rewrite(url);
    }
  }

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

  if (isPublicPath(pathname)) return NextResponse.next();

  const cookie = req.cookies.get(authCookieName())?.value;
  const ok = await verifySessionCookieValue(cookie);
  if (ok) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
