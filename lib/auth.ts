const COOKIE_NAME = "aw_session";
const COOKIE_VERSION = 1;

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

type SessionPayload = {
  v: number;
  iat: number;
};

export function authCookieName() {
  return COOKIE_NAME;
}

export async function createSessionCookieValue() {
  const secret = requireEnv("AUTH_SECRET");
  const payload: SessionPayload = { v: COOKIE_VERSION, iat: Date.now() };
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(payloadJson));
  const sig = await hmacSha256Base64Url(secret, payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function verifySessionCookieValue(value: string | undefined | null) {
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
    const payload = JSON.parse(payloadText) as SessionPayload;
    return payload?.v === COOKIE_VERSION;
  } catch {
    return false;
  }
}

export function checkCredentials(username: string, password: string) {
  const expectedUser = requireEnv("APP_USERNAME");
  const expectedPass = requireEnv("APP_PASSWORD");
  return username === expectedUser && password === expectedPass;
}

