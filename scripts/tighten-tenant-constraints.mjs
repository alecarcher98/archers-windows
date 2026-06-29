// Stage 5: tighten multi-tenancy constraints now that every row is backfilled
// (scripts/backfill-archers-windows-tenant.mjs) and the app reads/writes
// company_id everywhere (lib/kv.ts, lib/settings.ts, lib/credentials.ts).
//
// Each table's changes run inside one transaction, so there's never a moment
// with no primary key on a live table — either the whole change for that
// table commits, or it rolls back to exactly how it was.
//
// Run with: node --env-file=.env scripts/tighten-tenant-constraints.mjs
import { sql } from "@vercel/postgres";

const NOT_NULL_TABLES = ["customers", "moves", "removed", "days", "app_settings"];

async function withTransaction(label, fn) {
  const client = await sql.connect();
  try {
    await client.query("begin");
    await fn(client);
    await client.query("commit");
    console.log(`${label}: committed`);
  } catch (err) {
    await client.query("rollback");
    console.error(`${label}: rolled back —`, err.message);
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  for (const table of NOT_NULL_TABLES) {
    await withTransaction(`${table}.company_id NOT NULL`, async (client) => {
      await client.query(`alter table ${table} alter column company_id set not null`);
    });
  }

  await withTransaction("days primary key -> (company_id, date)", async (client) => {
    await client.query("alter table days drop constraint days_pkey");
    await client.query("alter table days add primary key (company_id, date)");
  });

  await withTransaction("app_settings primary key -> (company_id, id)", async (client) => {
    await client.query("alter table app_settings drop constraint app_settings_pkey");
    await client.query("alter table app_settings add primary key (company_id, id)");
  });

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
