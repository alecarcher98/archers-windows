import { localKv } from "@/lib/localKv";
import { ensureSchema, isPostgresEnabled } from "@/lib/db";

const PBKDF2_ITERATIONS = 100_000;
const DEFAULT_USERNAME = "archer";
const DEFAULT_PASSWORD = "archer";

type StoredCredentials = {
  username: string;
  passwordHash: string;
  passwordSalt: string;
};

type KvLike = {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<unknown>;
};

function hasRemoteKvEnv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

const kv: KvLike = hasRemoteKvEnv()
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require("@vercel/kv").kv as KvLike)
  : (localKv as unknown as KvLike);

// Credentials are looked up *before* a session exists (this is what mints
// one), so — unlike lib/kv.ts / lib/settings.ts — every function here takes
// an explicit companyId rather than reading it implicitly from the session.
function authKey(companyId: string) {
  return `app:auth:${companyId}`;
}

function bytesToBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}

function base64ToBytes(b64: string) {
  return new Uint8Array(Buffer.from(b64, "base64"));
}

async function hashPassword(password: string, salt: Uint8Array) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  return bytesToBase64(new Uint8Array(bits));
}

async function hashWithNewSalt(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordHash = await hashPassword(password, salt);
  return { passwordHash, passwordSalt: bytesToBase64(salt) };
}

function isStoredCredentials(raw: unknown): raw is StoredCredentials {
  return (
    typeof raw === "object" &&
    raw !== null &&
    typeof (raw as StoredCredentials).username === "string" &&
    typeof (raw as StoredCredentials).passwordHash === "string" &&
    typeof (raw as StoredCredentials).passwordSalt === "string"
  );
}

async function readStoredCredentials(companyId: string): Promise<StoredCredentials | null> {
  if (isPostgresEnabled()) {
    await ensureSchema();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { sql } = require("@vercel/postgres") as typeof import("@vercel/postgres");
    const res = await sql`
      select value from app_settings where company_id = ${companyId}::uuid and id = 'auth' limit 1
    `;
    const row = res.rows[0] as { value: unknown } | undefined;
    return isStoredCredentials(row?.value) ? row.value : null;
  }
  const raw = await kv.get(authKey(companyId));
  return isStoredCredentials(raw) ? raw : null;
}

async function writeStoredCredentials(companyId: string, creds: StoredCredentials) {
  if (isPostgresEnabled()) {
    await ensureSchema();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { sql } = require("@vercel/postgres") as typeof import("@vercel/postgres");
    await sql`
      insert into app_settings (id, company_id, value)
      values ('auth', ${companyId}::uuid, ${creds as never})
      on conflict (company_id, id) do update set value = excluded.value
    `;
    return;
  }
  await kv.set(authKey(companyId), creds);
}

async function getOrSeedCredentials(companyId: string): Promise<StoredCredentials> {
  const existing = await readStoredCredentials(companyId);
  if (existing) return existing;

  const { passwordHash, passwordSalt } = await hashWithNewSalt(DEFAULT_PASSWORD);
  const seeded: StoredCredentials = {
    username: DEFAULT_USERNAME,
    passwordHash,
    passwordSalt,
  };
  await writeStoredCredentials(companyId, seeded);
  return seeded;
}

export async function verifyCredentials(
  companyId: string,
  username: string,
  password: string,
): Promise<boolean> {
  const stored = await getOrSeedCredentials(companyId);
  if (username !== stored.username) return false;
  const candidateHash = await hashPassword(password, base64ToBytes(stored.passwordSalt));
  return candidateHash === stored.passwordHash;
}

export async function setCredentials(
  companyId: string,
  username: string,
  password: string,
): Promise<void> {
  const { passwordHash, passwordSalt } = await hashWithNewSalt(password);
  await writeStoredCredentials(companyId, { username, passwordHash, passwordSalt });
}

export async function getUsername(companyId: string): Promise<string> {
  const stored = await getOrSeedCredentials(companyId);
  return stored.username;
}
