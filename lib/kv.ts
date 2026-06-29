import type { Customer, DayRecord, IsoDate, PriceHistoryEntry } from "@/lib/models";
import { localKv } from "@/lib/localKv";
import { ensureSchema, isPostgresEnabled } from "@/lib/db";
import { getCurrentCompanyId } from "@/lib/tenant";

type PgRow<T> = { rows: T[] };

async function pg() {
  // Lazy import to avoid bundling when not used
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("@vercel/postgres") as typeof import("@vercel/postgres");
  return mod.sql;
}

// Use Vercel KV when configured, otherwise fall back to a local JSON-backed store.
// This keeps local dev working without any external setup.
type KvLike = {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<unknown>;
  del: (key: string) => Promise<unknown>;
  mget: (...keys: string[]) => Promise<unknown[]>;
  sadd: (key: string, member: string) => Promise<unknown>;
  srem: (key: string, member: string) => Promise<unknown>;
  smembers: (key: string) => Promise<unknown>;
};

function hasRemoteKvEnv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

const kv: KvLike = hasRemoteKvEnv()
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require("@vercel/kv").kv as KvLike)
  : (localKv as unknown as KvLike);

type CustomerRow = Customer & {
  notes?: string | null;
  pausedUntil?: string | null;
  priceHistory?: PriceHistoryEntry[] | null;
};

function mapCustomerRow(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    street: row.street ?? undefined,
    phone: row.phone ?? undefined,
    defaultPricePence: row.defaultPricePence,
    startDate: row.startDate,
    frequencyWeeks: row.frequencyWeeks,
    oneOff: Boolean(row.oneOff),
    active: row.active,
    notes: row.notes ?? undefined,
    pausedUntil: (row.pausedUntil as IsoDate | null) ?? undefined,
    priceHistory: Array.isArray(row.priceHistory) ? row.priceHistory : undefined,
  };
}

// Every key is namespaced by tenant — required for the local KV/JSON fallback
// to keep the same per-company isolation guarantee Postgres gets from
// `where company_id = ...` on every query below.
export const keys = {
  customer: (companyId: string, id: string) => `customer:${companyId}:${id}`,
  day: (companyId: string, date: IsoDate) => `day:${companyId}:${date}`,
  customersAll: (companyId: string) => `customers:all:${companyId}`,
  move: (companyId: string, jobId: string) => `move:${companyId}:${jobId}`,
  movesTo: (companyId: string, date: IsoDate) => `moves:to:${companyId}:${date}`,
  removed: (companyId: string, jobId: string) => `removed:${companyId}:${jobId}`,
  removedAll: (companyId: string) => `removed:all:${companyId}`,
} as const;

export type MoveRecord = { jobId: string; fromDate: IsoDate; toDate: IsoDate; movedAt: number };
export type RemovedRecord = {
  jobId: string;
  dueDate: IsoDate;
  removedAt: number;
  note?: string;
};

export async function listCustomerIds(companyIdOverride?: string): Promise<string[]> {
  const companyId = companyIdOverride ?? (await getCurrentCompanyId());
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    const res = (await sql`
      select id::text as id from customers
      where company_id = ${companyId}::uuid
      order by name asc
    `) as PgRow<{ id: string }>;
    return res.rows.map((r) => r.id);
  }
  const ids = (await kv.smembers(keys.customersAll(companyId))) as string[];
  return ids.sort();
}

export async function getCustomersByIds(
  ids: string[],
  companyIdOverride?: string,
): Promise<Customer[]> {
  if (ids.length === 0) return [];
  const companyId = companyIdOverride ?? (await getCurrentCompanyId());
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    const res = (await sql`
      select
        id::text as id,
        name,
        address,
        street,
        phone,
        default_price_pence as "defaultPricePence",
        to_char(start_date, 'YYYY-MM-DD') as "startDate",
        frequency_weeks as "frequencyWeeks",
        one_off as "oneOff",
        active,
        notes,
        to_char(paused_until, 'YYYY-MM-DD') as "pausedUntil",
        price_history as "priceHistory"
      from customers
      where company_id = ${companyId}::uuid and id = any(${ids as unknown as never}::uuid[])
    `) as PgRow<CustomerRow>;
    return res.rows.map(mapCustomerRow);
  }
  const ks = ids.map((id) => keys.customer(companyId, id));
  const rows = await kv.mget(...ks);
  return (rows as Array<Customer | null>).filter((c): c is Customer => Boolean(c));
}

export async function getCustomer(id: string, companyIdOverride?: string): Promise<Customer | null> {
  const companyId = companyIdOverride ?? (await getCurrentCompanyId());
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    const res = (await sql`
      select
        id::text as id,
        name,
        address,
        street,
        phone,
        default_price_pence as "defaultPricePence",
        to_char(start_date, 'YYYY-MM-DD') as "startDate",
        frequency_weeks as "frequencyWeeks",
        one_off as "oneOff",
        active,
        notes,
        to_char(paused_until, 'YYYY-MM-DD') as "pausedUntil",
        price_history as "priceHistory"
      from customers
      where company_id = ${companyId}::uuid and id = ${id}::uuid
      limit 1
    `) as PgRow<CustomerRow>;
    const row = res.rows[0];
    return row ? mapCustomerRow(row) : null;
  }
  const c = (await kv.get(keys.customer(companyId, id))) as Customer | null;
  return c ?? null;
}

export async function putCustomer(customer: Customer, companyIdOverride?: string) {
  const companyId = companyIdOverride ?? (await getCurrentCompanyId());
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    const historyJson = JSON.stringify(customer.priceHistory ?? []);
    await sql`
      insert into customers (
        id, company_id, name, address, street, phone,
        default_price_pence, start_date, frequency_weeks, one_off, active,
        notes, paused_until, price_history
      ) values (
        ${customer.id}::uuid,
        ${companyId}::uuid,
        ${customer.name},
        ${customer.address},
        ${customer.street ?? null},
        ${customer.phone ?? null},
        ${customer.defaultPricePence},
        ${customer.startDate}::date,
        ${customer.frequencyWeeks},
        ${customer.oneOff ?? false},
        ${customer.active},
        ${customer.notes ?? null},
        ${customer.pausedUntil ?? null}::date,
        ${historyJson}::jsonb
      )
      on conflict (id) do update set
        name = excluded.name,
        address = excluded.address,
        street = excluded.street,
        phone = excluded.phone,
        default_price_pence = excluded.default_price_pence,
        start_date = excluded.start_date,
        frequency_weeks = excluded.frequency_weeks,
        one_off = excluded.one_off,
        active = excluded.active,
        notes = excluded.notes,
        paused_until = excluded.paused_until,
        price_history = excluded.price_history
      where customers.company_id = ${companyId}::uuid
    `;
    return;
  }
  await kv.set(keys.customer(companyId, customer.id), customer);
  await kv.sadd(keys.customersAll(companyId), customer.id);
}

export async function deleteCustomer(id: string, companyIdOverride?: string) {
  const companyId = companyIdOverride ?? (await getCurrentCompanyId());
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    await sql`delete from customers where company_id = ${companyId}::uuid and id = ${id}::uuid`;
    return;
  }
  await kv.del(keys.customer(companyId, id));
  await kv.srem(keys.customersAll(companyId), id);
}

export function emptyDay(date: IsoDate): DayRecord {
  return { date, orderedJobIds: [], jobState: {}, oneOff: {} };
}

export async function getDay(date: IsoDate): Promise<DayRecord> {
  const companyId = await getCurrentCompanyId();
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    const res = (await sql`
      select record
      from days
      where company_id = ${companyId}::uuid and date = ${date}::date
      limit 1
    `) as PgRow<{ record: unknown }>;
    const row = res.rows[0];
    if (!row) return emptyDay(date);
    const d = row.record as Partial<DayRecord>;
    return {
      date,
      orderedJobIds: Array.isArray(d.orderedJobIds) ? d.orderedJobIds : [],
      jobState:
        typeof d.jobState === "object" && d.jobState ? (d.jobState as DayRecord["jobState"]) : {},
      oneOff:
        typeof d.oneOff === "object" && d.oneOff ? (d.oneOff as DayRecord["oneOff"]) : {},
    };
  }
  const d = (await kv.get(keys.day(companyId, date))) as Partial<DayRecord> | null;
  if (!d) return emptyDay(date);
  return {
    date,
    orderedJobIds: Array.isArray(d.orderedJobIds) ? d.orderedJobIds : [],
    jobState:
      typeof d.jobState === "object" && d.jobState ? (d.jobState as DayRecord["jobState"]) : {},
    oneOff:
      typeof d.oneOff === "object" && d.oneOff ? (d.oneOff as DayRecord["oneOff"]) : {},
  };
}

export async function putDay(record: DayRecord) {
  const companyId = await getCurrentCompanyId();
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    const recordJson = JSON.stringify(record);
    await sql`
      insert into days (date, company_id, record)
      values (${record.date}::date, ${companyId}::uuid, ${recordJson}::jsonb)
      on conflict (company_id, date) do update set record = excluded.record
    `;
    return;
  }
  await kv.set(keys.day(companyId, record.date), record);
}

export async function getMove(jobId: string): Promise<MoveRecord | null> {
  const companyId = await getCurrentCompanyId();
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    const res = (await sql`
      select
        job_id as "jobId",
        to_char(from_date, 'YYYY-MM-DD') as "fromDate",
        to_char(to_date, 'YYYY-MM-DD') as "toDate",
        moved_at as "movedAt"
      from moves
      where company_id = ${companyId}::uuid and job_id = ${jobId}
      limit 1
    `) as PgRow<MoveRecord>;
    return res.rows[0] ?? null;
  }
  return ((await kv.get(keys.move(companyId, jobId))) as MoveRecord | null) ?? null;
}

export async function listMovesTo(date: IsoDate): Promise<string[]> {
  const companyId = await getCurrentCompanyId();
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    const res = (await sql`
      select job_id as "jobId"
      from moves
      where company_id = ${companyId}::uuid and to_date = ${date}::date
    `) as PgRow<{ jobId: string }>;
    return res.rows.map((r) => r.jobId);
  }
  return ((await kv.smembers(keys.movesTo(companyId, date))) as string[]) ?? [];
}

export async function setMove(jobId: string, fromDate: IsoDate, toDate: IsoDate) {
  const companyId = await getCurrentCompanyId();
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    await sql`
      insert into moves (job_id, company_id, from_date, to_date, moved_at)
      values (${jobId}, ${companyId}::uuid, ${fromDate}::date, ${toDate}::date, ${Date.now()})
      on conflict (job_id) do update set
        from_date = excluded.from_date,
        to_date = excluded.to_date,
        moved_at = excluded.moved_at
      where moves.company_id = ${companyId}::uuid
    `;
    return;
  }
  const existing = await getMove(jobId);
  if (existing) {
    await kv.srem(keys.movesTo(companyId, existing.toDate), jobId);
  }
  const rec: MoveRecord = { jobId, fromDate, toDate, movedAt: Date.now() };
  await kv.set(keys.move(companyId, jobId), rec);
  await kv.sadd(keys.movesTo(companyId, toDate), jobId);
}

export async function clearMove(jobId: string) {
  const companyId = await getCurrentCompanyId();
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    await sql`delete from moves where company_id = ${companyId}::uuid and job_id = ${jobId}`;
    return;
  }
  const existing = await getMove(jobId);
  if (existing) {
    await kv.srem(keys.movesTo(companyId, existing.toDate), jobId);
  }
  await kv.del(keys.move(companyId, jobId));
}

export async function listRemovedJobIds(): Promise<string[]> {
  const companyId = await getCurrentCompanyId();
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    const res = (await sql`
      select job_id as "jobId" from removed where company_id = ${companyId}::uuid
    `) as PgRow<{ jobId: string }>;
    return res.rows.map((r) => r.jobId);
  }
  return ((await kv.smembers(keys.removedAll(companyId))) as string[]) ?? [];
}

export async function getRemoved(jobId: string): Promise<RemovedRecord | null> {
  const companyId = await getCurrentCompanyId();
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    const res = (await sql`
      select
        job_id as "jobId",
        to_char(due_date, 'YYYY-MM-DD') as "dueDate",
        removed_at as "removedAt",
        note
      from removed
      where company_id = ${companyId}::uuid and job_id = ${jobId}
      limit 1
    `) as PgRow<RemovedRecord>;
    return res.rows[0] ?? null;
  }
  return ((await kv.get(keys.removed(companyId, jobId))) as RemovedRecord | null) ?? null;
}

export async function removeFromWeek(jobId: string, dueDate: IsoDate, note?: string) {
  const companyId = await getCurrentCompanyId();
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    await sql`
      insert into removed (job_id, company_id, due_date, removed_at, note)
      values (${jobId}, ${companyId}::uuid, ${dueDate}::date, ${Date.now()}, ${note ?? null})
      on conflict (job_id) do update set
        due_date = excluded.due_date,
        removed_at = excluded.removed_at,
        note = excluded.note
      where removed.company_id = ${companyId}::uuid
    `;
    return;
  }
  const rec: RemovedRecord = { jobId, dueDate, removedAt: Date.now(), note };
  await kv.set(keys.removed(companyId, jobId), rec);
  await kv.sadd(keys.removedAll(companyId), jobId);
}

export async function restoreRemoved(jobId: string) {
  const companyId = await getCurrentCompanyId();
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    await sql`delete from removed where company_id = ${companyId}::uuid and job_id = ${jobId}`;
    return;
  }
  await kv.del(keys.removed(companyId, jobId));
  await kv.srem(keys.removedAll(companyId), jobId);
}
