// Fixed-window rate limiter for auth-adjacent endpoints (company/admin login,
// credential changes) — these are the endpoints most attractive for brute
// force and enumeration, per the multi-tenant security checklist.
//
// Backed by Upstash Redis (@vercel/kv) in production via atomic INCR/EXPIRE
// so limits hold across serverless invocations; falls back to the local
// JSON-backed store for dev, where the read-modify-write isn't atomic but
// that matches the rest of localKv's single-user-dev guarantees.
import { localKv } from "@/lib/localKv";

function hasRemoteKvEnv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

type RemoteKv = {
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<unknown>;
  ttl: (key: string) => Promise<number>;
};

type LocalBucket = { count: number; resetAt: number };

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
