import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authCookieName, verifySessionCookieValue } from "@/lib/auth";

const PUBLIC_PATH_PREFIXES = ["/login", "/api/auth/login", "/api/auth/logout"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
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

