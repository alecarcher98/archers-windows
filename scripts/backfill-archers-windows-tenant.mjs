// One-time (but safely re-runnable) backfill: creates the "Archer's Windows"
// tenant row and points every existing customers/days/moves/removed/app_settings
// row at it. Safe to re-run — every step is idempotent (on conflict do nothing /
// where company_id is null).
//
// Run with: node --env-file=.env scripts/backfill-archers-windows-tenant.mjs
import { sql } from "@vercel/postgres";
import { randomUUID } from "node:crypto";

const SLUG = "archers-windows";
const DISPLAY_NAME = "Archer's Windows";

async function main() {
  const existing = await sql`select id from companies where slug = ${SLUG} limit 1`;
  let companyId = existing.rows[0]?.id;

  if (!companyId) {
    companyId = randomUUID();
    await sql`
      insert into companies (id, display_name, slug)
      values (${companyId}, ${DISPLAY_NAME}, ${SLUG})
    `;
    console.log(`Created company ${DISPLAY_NAME} (${companyId})`);
  } else {
    console.log(`Found existing company ${DISPLAY_NAME} (${companyId})`);
  }

  const tables = ["customers", "moves", "removed", "days", "app_settings"];
  for (const table of tables) {
    const before = await sql.query(
      `select count(*)::int as n from ${table} where company_id is null`,
    );
    const nullCount = before.rows[0].n;
    if (nullCount === 0) {
      console.log(`${table}: nothing to backfill (0 rows with null company_id)`);
      continue;
    }
    await sql.query(`update ${table} set company_id = $1 where company_id is null`, [
      companyId,
    ]);
    console.log(`${table}: backfilled ${nullCount} row(s)`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
