import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieName } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: authCookieName(),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return NextResponse.json({ ok: true });
}

