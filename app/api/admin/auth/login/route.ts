import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminCookieName, createAdminSessionCookieValue, verifyAdminSecret } from "@/lib/auth";
import { checkRateLimit, clientIp, rateLimitedResponse } from "@/lib/rateLimit";

// Tighter than company login: the admin secret is one shared credential that
// controls every tenant, so brute-force attempts get a stricter budget.
const ADMIN_LOGIN_RATE_LIMIT = { max: 5, windowSeconds: 15 * 60 };

export async function POST(req: Request) {
  const rate = await checkRateLimit(`admin-login:${clientIp(req)}`, ADMIN_LOGIN_RATE_LIMIT);
  if (!rate.allowed) return rateLimitedResponse(rate.retryAfterSeconds);

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
