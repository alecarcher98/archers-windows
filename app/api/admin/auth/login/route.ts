import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminCookieName, createAdminSessionCookieValue, verifyAdminSecret } from "@/lib/auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { secret?: unknown } | null;
  const secret = typeof body?.secret === "string" ? body.secret : "";

  if (!verifyAdminSecret(secret)) {
    return NextResponse.json({ ok: false, error: "Incorrect secret" }, { status: 401 });
  }

  const value = await createAdminSessionCookieValue();
  const cookieStore = await cookies();
  cookieStore.set({
    name: adminCookieName(),
    value,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
