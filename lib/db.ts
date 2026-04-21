import { sql } from "@vercel/postgres";

let didInit = false;

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

/** Idempotent migrations safe to run on every request (handles schema added after first boot). */
async function ensureMigrations() {
  if (!isPostgresEnabled()) return;

  await sql`
    create table if not exists app_settings (
      id text primary key,
      value jsonb not null
    );
  `;

  await sql`alter table customers add column if not exists notes text`;
  await sql`alter table customers add column if not exists paused_until date`;
  await sql`alter table customers add column if not exists price_history jsonb default '[]'::jsonb`;
}

export async function ensureSchema() {
  if (!isPostgresEnabled()) return;

  await ensureMigrations();

  if (didInit) return;

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
