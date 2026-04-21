import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieName, checkCredentials, createSessionCookieValue } from "@/lib/auth";

export async function POST(req: Request) {
  let username = "";
  let password = "";

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => null)) as
      | { username?: unknown; password?: unknown }
      | null;
    username = typeof body?.username === "string" ? body.username : "";
    password = typeof body?.password === "string" ? body.password : "";
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    username = String(form.get("username") ?? "");
    password = String(form.get("password") ?? "");
  }

  if (!checkCredentials(username, password)) {
    return NextResponse.json({ ok: false, error: "Invalid login" }, { status: 401 });
  }

  const value = await createSessionCookieValue();
  const cookieStore = await cookies();
  cookieStore.set({
    name: authCookieName(),
    value,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

