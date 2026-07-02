import { sql } from "@vercel/postgres";

let didInit = false;
let initPromise: Promise<void> | null = null;

function hasPostgresEnv() {
  return Boolean(
    process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.DATABASE_URL,
  );
}

export function isPostgresEnabled() {
  return hasPostgresEnv();
}

/** Idempotent migrations — only need to run once per warm instance (see
 * ensureSchema below); a new deploy gets a fresh instance, so schema added
 * after first boot is still picked up without a manual migration step. */
async function ensureMigrations() {
  await sql`
    create table if not exists app_settings (
      id text primary key,
      value jsonb not null
    );
  `;

  await sql`alter table customers add column if not exists notes text`;
  await sql`alter table customers add column if not exists paused_until date`;
  await sql`alter table customers add column if not exists price_history jsonb default '[]'::jsonb`;
  await sql`alter table customers add column if not exists one_off boolean not null default false`;

  // --- Multi-tenancy: additive only. Nothing reads company_id yet, so this
  // is a behavioral no-op until a later migration backfills and tightens it. ---
  await sql`
    create table if not exists companies (
      id uuid primary key,
      display_name text not null,
      slug text not null unique,
      status text not null default 'active',
      brand_color text null,
      created_at timestamptz not null default now()
    );
  `;
  await sql`alter table customers add column if not exists company_id uuid references companies(id)`;
  await sql`alter table moves add column if not exists company_id uuid references companies(id)`;
  await sql`alter table removed add column if not exists company_id uuid references companies(id)`;
  await sql`alter table days add column if not exists company_id uuid references companies(id)`;
  await sql`alter table app_settings add column if not exists company_id uuid references companies(id)`;
}

export async function ensureSchema() {
  if (!isPostgresEnabled()) return;
  if (didInit) return;
  // Concurrent requests on a fresh instance all await the same in-flight
  // init instead of each kicking off their own redundant DDL.
  if (!initPromise) {
    initPromise = runSchemaInit().catch((err) => {
      // Let the next call retry instead of caching a transient failure forever.
      initPromise = null;
      throw err;
    });
  }
  await initPromise;
}

async function runSchemaInit() {
  await ensureMigrations();

  await sql`
    create table if not exists customers (
      id uuid primary key,
      name text not null,
      address text not null,
      street text null,
      phone text null,
      default_price_pence integer not null,
      start_date date not null,
      frequency_weeks integer not null,
      active boolean not null default true
    );
  `;

  await sql`
    create table if not exists days (
      date date primary key,
      record jsonb not null
    );
  `;

  await sql`
    create table if not exists moves (
      job_id text primary key,
      from_date date not null,
      to_date date not null,
      moved_at bigint not null
    );
  `;
  await sql`create index if not exists moves_to_date_idx on moves (to_date);`;

  await sql`
    create table if not exists removed (
      job_id text primary key,
      due_date date not null,
      removed_at bigint not null,
      note text null
    );
  `;

  didInit = true;
}
