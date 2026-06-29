import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieName, createSessionCookieValue, tenantCookieName } from "@/lib/auth";
import { verifyCredentials } from "@/lib/credentials";
import { getDefaultCompanyId, resolveCompanyBySlug } from "@/lib/tenant";

export async function POST(req: Request) {
  let username = "";
  let password = "";
  let slug = "";

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => null)) as
      | { username?: unknown; password?: unknown; slug?: unknown }
      | null;
    username = typeof body?.username === "string" ? body.username : "";
    password = typeof body?.password === "string" ? body.password : "";
    slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    username = String(form.get("username") ?? "");
    password = String(form.get("password") ?? "");
    slug = String(form.get("slug") ?? "").trim();
  }

  const cookieStore = await cookies();

  // Resolve which tenant to authenticate against: explicit slug from the
  // login form first, then the "last visited tenant" hint cookie, then the
  // single-tenant default (preserves today's behaviour for a bare /login visit).
  if (!slug) slug = cookieStore.get(tenantCookieName())?.value ?? "";

  let companyId: string;
  let resolvedSlug = slug;
  if (slug) {
    const company = await resolveCompanyBySlug(slug);
    if (!company || company.status !== "active") {
      return NextResponse.json({ ok: false, error: "Unknown company" }, { status: 404 });
    }
    companyId = company.id;
  } else {
    companyId = await getDefaultCompanyId();
    resolvedSlug = "archers-windows";
  }

  if (!(await verifyCredentials(companyId, username, password))) {
    return NextResponse.json({ ok: false, error: "Invalid login" }, { status: 401 });
  }

  const value = await createSessionCookieValue(companyId, "company");
  cookieStore.set({
    name: authCookieName(),
    value,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  cookieStore.set({
    name: tenantCookieName(),
    value: resolvedSlug,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ ok: true });
}
