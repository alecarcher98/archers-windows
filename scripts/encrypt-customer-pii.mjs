// One-off (but safely re-runnable) migration: encrypts phone, notes,
// address, and street on every existing `customers` row, across every
// tenant, using the same AES-256-GCM scheme as lib/encryption.ts (that file
// is the source of truth for the "encv1:<iv>:<ciphertext>" format — this
// script duplicates the minimal logic because it runs under plain node,
// not through Next's TS compiler).
//
// Requires PII_ENCRYPTION_KEY to be set (see .env.example) and lib/kv.ts's
// encryption changes to already be deployed — run this AFTER that deploy is
// live and confirmed healthy, not before (see the deployment plan).
//
// Run with: node --env-file=.env scripts/encrypt-customer-pii.mjs
import { sql } from "@vercel/postgres";
import { webcrypto as crypto } from "node:crypto";

const FORMAT_PREFIX = "encv1";
const GCM_IV_BYTES = 12;

function requireEncryptionKeyHex() {
  const hex = process.env.PII_ENCRYPTION_KEY;
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("Missing or malformed env var: PII_ENCRYPTION_KEY (expected 64 hex chars)");
  }
  return hex;
}

let cachedKey = null;
function importKey() {
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

function isEncryptedField(value) {
  const parts = value.split(":");
  return parts.length === 3 && parts[0] === FORMAT_PREFIX;
}

async function encryptField(plaintext) {
  const key = await importKey();
  const iv = crypto.getRandomValues(new Uint8Array(GCM_IV_BYTES));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return `${FORMAT_PREFIX}:${Buffer.from(iv).toString("base64")}:${Buffer.from(ciphertext).toString("base64")}`;
}

async function encryptOrNull(value) {
  if (value == null) return null;
  return encryptField(value);
}

async function main() {
  const companies = await sql`select id, display_name from companies`;

  let scanned = 0;
  let encrypted = 0;

  for (const company of companies.rows) {
    const rows = await sql`
      select id, address, street, phone, notes
      from customers
      where company_id = ${company.id}::uuid
    `;

    let companyEncrypted = 0;
    for (const row of rows.rows) {
      scanned++;
      if (isEncryptedField(row.address)) continue; // already migrated

      const [address, street, phone, notes] = await Promise.all([
        encryptField(row.address),
        encryptOrNull(row.street),
        encryptOrNull(row.phone),
        encryptOrNull(row.notes),
      ]);

      await sql`
        update customers
        set address = ${address}, street = ${street}, phone = ${phone}, notes = ${notes}
        where id = ${row.id}::uuid
      `;
      companyEncrypted++;
      encrypted++;
    }

    console.log(
      `${company.display_name}: encrypted ${companyEncrypted}/${rows.rows.length} customer row(s)`,
    );
  }

  console.log(`Done. Scanned ${scanned}, encrypted ${encrypted}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
