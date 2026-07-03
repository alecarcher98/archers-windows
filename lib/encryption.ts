// Application-level field encryption for customer PII stored in Postgres
// (phone, notes, address, street — see lib/kv.ts). Node runtime only: this
// is imported exclusively from lib/kv.ts's Postgres branches, which already
// require() @vercel/postgres and so never run on the Edge runtime.
//
// Stored format: "encv1:<base64(iv)>:<base64(ciphertext‖authtag)>". A value
// that doesn't match this shape is treated as legacy plaintext and passed
// through unchanged on read, so a mixed plaintext/encrypted table is safe
// until scripts/encrypt-customer-pii.mjs sweeps the remaining rows.
const FORMAT_PREFIX = "encv1";
const GCM_IV_BYTES = 12;

let cachedKey: Promise<CryptoKey> | null = null;

function requireEncryptionKeyHex(): string {
  const hex = process.env.PII_ENCRYPTION_KEY;
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("Missing or malformed env var: PII_ENCRYPTION_KEY (expected 64 hex chars)");
  }
  return hex;
}

function importKey(): Promise<CryptoKey> {
  if (!cachedKey) {
    cachedKey = crypto.subtle.importKey(
      "raw",
      Buffer.from(requireEncryptionKeyHex(), "hex"),
      "AES-GCM",
      false,
      ["encrypt", "decrypt"],
    );
  }
  return cachedKey;
}

export function isEncryptedField(value: string): boolean {
  const parts = value.split(":");
  return parts.length === 3 && parts[0] === FORMAT_PREFIX;
}

export async function encryptField(plaintext: string): Promise<string> {
  const key = await importKey();
  const iv = crypto.getRandomValues(new Uint8Array(GCM_IV_BYTES));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext));
  return `${FORMAT_PREFIX}:${Buffer.from(iv).toString("base64")}:${Buffer.from(ciphertext).toString("base64")}`;
}

export async function decryptField(stored: string): Promise<string> {
  if (!isEncryptedField(stored)) return stored;
  const [, ivB64, ctB64] = stored.split(":");
  const key = await importKey();
  const iv = Buffer.from(ivB64, "base64");
  const ciphertext = Buffer.from(ctB64, "base64");
  try {
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(plaintext);
  } catch (err) {
    console.error("decryptField: failed to decrypt a PII field (wrong key or corrupted data)");
    throw err;
  }
}

export async function encryptFieldOrNull(value: string | null | undefined): Promise<string | null> {
  if (value == null) return null;
  return encryptField(value);
}

export async function decryptFieldOrNull(value: string | null | undefined): Promise<string | undefined> {
  if (value == null) return undefined;
  return decryptField(value);
}
