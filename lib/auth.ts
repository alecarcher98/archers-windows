const COOKIE_NAME = "aw_session";
const TENANT_COOKIE_NAME = "aw_tenant";
// Bumped for multi-tenancy: payloads now carry companyId/role, so old v1
// sessions are cleanly rejected (forces one re-login, not a security hole).
const COOKIE_VERSION = 2;

// Admin sessions are a fully separate cookie/payload shape from company
// sessions — gated by ADMIN_SECRET, never carries a companyId, so a bug in
// one can't be replayed as the other.
const ADMIN_COOKIE_NAME = "aw_admin_session";
const ADMIN_COOKIE_VERSION = 1;

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function bytesToBase64(bytes: Uint8Array) {
  // Edge runtime does not provide Buffer.
  // Payloads/signatures here are small, so a simple conversion is fine.
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function base64ToBytes(b64: string) {
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(b64, "base64"));
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function base64UrlEncode(bytes: Uint8Array) {
  const b64 = bytesToBase64(bytes);
  return b64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecodeToBytes(input: string): Uint8Array {
  const b64 = input.replaceAll("-", "+").replaceAll("_", "/");
  const padLen = (4 - (b64.length % 4)) % 4;
  const padded = b64 + "=".repeat(padLen);
  return base64ToBytes(padded);
}

async function hmacSha256Base64Url(secret: string, message: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
  return base64UrlEncode(sig);
}

export type SessionRole = "admin" | "company";

export type SessionPayload = {
  v: number;
  iat: number;
  companyId: string;
  role: SessionRole;
};

export function authCookieName() {
  return COOKIE_NAME;
}

/** Non-secret "which company did you last sign in to" hint — lets /login
 * know which tenant to authenticate against even after a session expires,
 * since inner app pages never carry a slug in their URL. */
export function tenantCookieName() {
  return TENANT_COOKIE_NAME;
}

export async function createSessionCookieValue(companyId: string, role: SessionRole = "company") {
  const secret = requireEnv("AUTH_SECRET");
  const payload: SessionPayload = { v: COOKIE_VERSION, iat: Date.now(), companyId, role };
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(payloadJson));
  const sig = await hmacSha256Base64Url(secret, payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function verifySessionCookieValue(
  value: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!value) return null;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;

  const expected = await hmacSha256Base64Url(secret, payloadB64);
  if (expected !== sig) return null;

  try {
    const payloadBytes = base64UrlDecodeToBytes(payloadB64);
    const payloadText = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadText) as Partial<SessionPayload>;
    if (payload?.v !== COOKIE_VERSION) return null;
    if (typeof payload.companyId !== "string" || !payload.companyId) return null;
    if (payload.role !== "admin" && payload.role !== "company") return null;
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

type AdminSessionPayload = {
  v: number;
  iat: number;
};

export function adminCookieName() {
  return ADMIN_COOKIE_NAME;
}

export async function createAdminSessionCookieValue() {
  const secret = requireEnv("AUTH_SECRET");
  const payload: AdminSessionPayload = { v: ADMIN_COOKIE_VERSION, iat: Date.now() };
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(payloadJson));
  const sig = await hmacSha256Base64Url(secret, payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function verifyAdminSessionCookieValue(
  value: string | undefined | null,
): Promise<boolean> {
  if (!value) return false;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;

  const parts = value.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sig] = parts;

  const expected = await hmacSha256Base64Url(secret, payloadB64);
  if (expected !== sig) return false;

  try {
    const payloadBytes = base64UrlDecodeToBytes(payloadB64);
    const payloadText = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadText) as Partial<AdminSessionPayload>;
    return payload?.v === ADMIN_COOKIE_VERSION;
  } catch {
    return false;
  }
}

export function verifyAdminSecret(candidate: string): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return candidate === secret;
}

