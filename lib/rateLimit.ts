// Fixed-window rate limiter for auth-adjacent endpoints (company/admin login,
// credential changes) — these are the endpoints most attractive for brute
// force and enumeration, per the multi-tenant security checklist.
//
// Storage priority: Postgres (atomic upsert against the `rate_limits`
// table — durable and correct across serverless invocations, and this app
// already requires Postgres in production, so no extra service to set up)
// > Upstash Redis (@vercel/kv), if configured > the local JSON-backed store,
// for dev environments with neither. The local-file path's read-modify-write
// isn't atomic, matching the rest of localKv's single-user-dev guarantees.
import { localKv } from "@/lib/localKv";
import { ensureSchema, isPostgresEnabled } from "@/lib/db";

function hasRemoteKvEnv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

type RemoteKv = {
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<unknown>;
  ttl: (key: string) => Promise<number>;
};

type LocalBucket = { count: number; resetAt: number };
type PgRow<T> = { rows: T[] };

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

export type RateLimitOptions = {
  /** Max allowed attempts within the window. */
  max: number;
  /** Window length in seconds. */
  windowSeconds: number;
};

/** Increments the counter for `key` and reports whether it's still under `max`. */
export async function checkRateLimit(
  key: string,
  { max, windowSeconds }: RateLimitOptions,
): Promise<RateLimitResult> {
  const bucketKey = `ratelimit:${key}`;

  try {
    if (isPostgresEnabled()) {
      await ensureSchema();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { sql } = require("@vercel/postgres") as typeof import("@vercel/postgres");
      const resetAt = new Date(Date.now() + windowSeconds * 1000);
      // Single atomic upsert: a fresh/expired bucket resets to count 1 with
      // a new reset_at; a live bucket just increments. The CASE branches
      // read the row's own pre-update state via `rate_limits.*`, so this is
      // race-free under concurrent requests without a separate lock.
      const res = (await sql`
        insert into rate_limits (id, count, reset_at)
        values (${bucketKey}, 1, ${resetAt.toISOString()}::timestamptz)
        on conflict (id) do update set
          count = case when rate_limits.reset_at <= now() then 1 else rate_limits.count + 1 end,
          reset_at = case when rate_limits.reset_at <= now() then excluded.reset_at else rate_limits.reset_at end
        returning count, reset_at
      `) as PgRow<{ count: number; reset_at: string }>;
      const row = res.rows[0];
      const rowResetAtMs = new Date(row.reset_at).getTime();
      if (row.count > max) {
        return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((rowResetAtMs - Date.now()) / 1000)) };
      }
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (hasRemoteKvEnv()) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const kv = (require("@vercel/kv") as { kv: RemoteKv }).kv;
      const count = await kv.incr(bucketKey);
      if (count === 1) {
        await kv.expire(bucketKey, windowSeconds);
      }
      if (count > max) {
        const ttl = await kv.ttl(bucketKey);
        return { allowed: false, retryAfterSeconds: ttl > 0 ? ttl : windowSeconds };
      }
      return { allowed: true, retryAfterSeconds: 0 };
    }

    const now = Date.now();
    const existing = (await localKv.get<LocalBucket>(bucketKey)) ?? null;
    if (!existing || existing.resetAt <= now) {
      await localKv.set(bucketKey, { count: 1, resetAt: now + windowSeconds * 1000 });
      return { allowed: true, retryAfterSeconds: 0 };
    }
    if (existing.count >= max) {
      return { allowed: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
    }
    await localKv.set(bucketKey, { count: existing.count + 1, resetAt: existing.resetAt });
    return { allowed: true, retryAfterSeconds: 0 };
  } catch (err) {
    // Rate limiting is defense-in-depth, not core function — a storage
    // failure (e.g. the local JSON-file fallback hitting a read-only
    // filesystem on serverless) must never lock every user out of login.
    console.error("checkRateLimit: storage error, failing open", err);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

/** Best-effort client identifier for rate-limit keys — proxies (Vercel, etc.)
 * set x-forwarded-for; falls back to a constant bucket shared by direct
 * connections (e.g. local dev) rather than throwing. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export function rateLimitedResponse(retryAfterSeconds: number) {
  return new Response(
    JSON.stringify({ ok: false, error: "Too many attempts. Try again later." }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(Math.max(1, Math.ceil(retryAfterSeconds))),
      },
    },
  );
}
