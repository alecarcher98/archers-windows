import { sql } from "@vercel/postgres";

let didInit = false;

function hasPostgresEnv() {
  // Vercel/Neon integration usually provides one or more of these.
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

export async function ensureSchema() {
  if (didInit) return;
  if (!isPostgresEnabled()) return;

  // Minimal schema for this app. Idempotent.
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

