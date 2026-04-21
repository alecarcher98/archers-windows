import type { Customer, DayRecord, IsoDate } from "@/lib/models";
import { localKv } from "@/lib/localKv";
import { ensureSchema, isPostgresEnabled } from "@/lib/db";

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

const CUSTOMER_SET_KEY = "customers:all";
const REMOVED_SET_KEY = "removed:all";

export const keys = {
  customer: (id: string) => `customer:${id}`,
  day: (date: IsoDate) => `day:${date}`,
  customersAll: () => CUSTOMER_SET_KEY,
  move: (jobId: string) => `move:${jobId}`,
  movesTo: (date: IsoDate) => `moves:to:${date}`,
  removed: (jobId: string) => `removed:${jobId}`,
  removedAll: () => REMOVED_SET_KEY,
} as const;

export type MoveRecord = { jobId: string; fromDate: IsoDate; toDate: IsoDate; movedAt: number };
export type RemovedRecord = {
  jobId: string;
  dueDate: IsoDate;
  removedAt: number;
  note?: string;
};

export async function listCustomerIds(): Promise<string[]> {
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    const res = (await sql`select id::text as id from customers order by name asc`) as PgRow<{
      id: string;
    }>;
    return res.rows.map((r) => r.id);
  }
  const ids = (await kv.smembers(keys.customersAll())) as string[];
  return ids.sort();
}

export async function getCustomersByIds(ids: string[]): Promise<Customer[]> {
  if (ids.length === 0) return [];
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
        active
      from customers
      where id = any(${ids as unknown as never}::uuid[])
    `) as PgRow<Customer>;
    return res.rows;
  }
  const ks = ids.map((id) => keys.customer(id));
  const rows = await kv.mget(...ks);
  return (rows as Array<Customer | null>).filter((c): c is Customer => Boolean(c));
}

export async function getCustomer(id: string): Promise<Customer | null> {
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
        active
      from customers
      where id = ${id}::uuid
      limit 1
    `) as PgRow<Customer>;
    return res.rows[0] ?? null;
  }
  const c = (await kv.get(keys.customer(id))) as Customer | null;
  return c ?? null;
}

export async function putCustomer(customer: Customer) {
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    await sql`
      insert into customers (
        id, name, address, street, phone,
        default_price_pence, start_date, frequency_weeks, active
      ) values (
        ${customer.id}::uuid,
        ${customer.name},
        ${customer.address},
        ${customer.street ?? null},
        ${customer.phone ?? null},
        ${customer.defaultPricePence},
        ${customer.startDate}::date,
        ${customer.frequencyWeeks},
        ${customer.active}
      )
      on conflict (id) do update set
        name = excluded.name,
        address = excluded.address,
        street = excluded.street,
        phone = excluded.phone,
        default_price_pence = excluded.default_price_pence,
        start_date = excluded.start_date,
        frequency_weeks = excluded.frequency_weeks,
        active = excluded.active
    `;
    return;
  }
  await kv.set(keys.customer(customer.id), customer);
  await kv.sadd(keys.customersAll(), customer.id);
}

export async function deleteCustomer(id: string) {
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    await sql`delete from customers where id = ${id}::uuid`;
    return;
  }
  await kv.del(keys.customer(id));
  await kv.srem(keys.customersAll(), id);
}

export function emptyDay(date: IsoDate): DayRecord {
  return { date, orderedJobIds: [], jobState: {}, oneOff: {} };
}

export async function getDay(date: IsoDate): Promise<DayRecord> {
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    const res = (await sql`
      select record
      from days
      where date = ${date}::date
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
  const d = (await kv.get(keys.day(date))) as Partial<DayRecord> | null;
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
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    const recordJson = (sql as unknown as { json: (v: unknown) => unknown }).json(record);
    await sql`
      insert into days (date, record)
      values (${record.date}::date, ${recordJson as never})
      on conflict (date) do update set record = excluded.record
    `;
    return;
  }
  await kv.set(keys.day(record.date), record);
}

export async function getMove(jobId: string): Promise<MoveRecord | null> {
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
      where job_id = ${jobId}
      limit 1
    `) as PgRow<MoveRecord>;
    return res.rows[0] ?? null;
  }
  return ((await kv.get(keys.move(jobId))) as MoveRecord | null) ?? null;
}

export async function listMovesTo(date: IsoDate): Promise<string[]> {
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    const res = (await sql`
      select job_id as "jobId"
      from moves
      where to_date = ${date}::date
    `) as PgRow<{ jobId: string }>;
    return res.rows.map((r) => r.jobId);
  }
  return ((await kv.smembers(keys.movesTo(date))) as string[]) ?? [];
}

export async function setMove(jobId: string, fromDate: IsoDate, toDate: IsoDate) {
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    await sql`
      insert into moves (job_id, from_date, to_date, moved_at)
      values (${jobId}, ${fromDate}::date, ${toDate}::date, ${Date.now()})
      on conflict (job_id) do update set
        from_date = excluded.from_date,
        to_date = excluded.to_date,
        moved_at = excluded.moved_at
    `;
    return;
  }
  const existing = await getMove(jobId);
  if (existing) {
    await kv.srem(keys.movesTo(existing.toDate), jobId);
  }
  const rec: MoveRecord = { jobId, fromDate, toDate, movedAt: Date.now() };
  await kv.set(keys.move(jobId), rec);
  await kv.sadd(keys.movesTo(toDate), jobId);
}

export async function clearMove(jobId: string) {
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    await sql`delete from moves where job_id = ${jobId}`;
    return;
  }
  const existing = await getMove(jobId);
  if (existing) {
    await kv.srem(keys.movesTo(existing.toDate), jobId);
  }
  await kv.del(keys.move(jobId));
}

export async function listRemovedJobIds(): Promise<string[]> {
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    const res = (await sql`select job_id as "jobId" from removed`) as PgRow<{ jobId: string }>;
    return res.rows.map((r) => r.jobId);
  }
  return ((await kv.smembers(keys.removedAll())) as string[]) ?? [];
}

export async function getRemoved(jobId: string): Promise<RemovedRecord | null> {
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
      where job_id = ${jobId}
      limit 1
    `) as PgRow<RemovedRecord>;
    return res.rows[0] ?? null;
  }
  return ((await kv.get(keys.removed(jobId))) as RemovedRecord | null) ?? null;
}

export async function removeFromWeek(jobId: string, dueDate: IsoDate, note?: string) {
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    await sql`
      insert into removed (job_id, due_date, removed_at, note)
      values (${jobId}, ${dueDate}::date, ${Date.now()}, ${note ?? null})
      on conflict (job_id) do update set
        due_date = excluded.due_date,
        removed_at = excluded.removed_at,
        note = excluded.note
    `;
    return;
  }
  const rec: RemovedRecord = { jobId, dueDate, removedAt: Date.now(), note };
  await kv.set(keys.removed(jobId), rec);
  await kv.sadd(keys.removedAll(), jobId);
}

export async function restoreRemoved(jobId: string) {
  if (isPostgresEnabled()) {
    await ensureSchema();
    const sql = await pg();
    await sql`delete from removed where job_id = ${jobId}`;
    return;
  }
  await kv.del(keys.removed(jobId));
  await kv.srem(keys.removedAll(), jobId);
}

