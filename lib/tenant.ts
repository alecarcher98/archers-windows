import { cookies } from "next/headers";
import { ensureSchema, isPostgresEnabled } from "@/lib/db";
import { authCookieName, verifySessionCookieValue } from "@/lib/auth";

export const LOCAL_DEV_COMPANY_ID = "local-dev";
const FALLBACK_SLUG = "archers-windows";

export type Company = {
  id: string;
  displayName: string;
  slug: string;
  status: string;
};

let cachedFallbackCompanyId: string | null = null;

/**
 * The single-tenant default ("archers-windows") — used when nothing in the
 * request names a tenant (a bare /login visit with no slug and no tenant
 * cookie). Deliberately ignores any existing session, so it can't resolve
 * to whichever company you happened to be logged into before.
 */
export async function getDefaultCompanyId(): Promise<string> {
  return getFallbackCompanyId();
}

async function getFallbackCompanyId(): Promise<string> {
  if (!isPostgresEnabled()) return LOCAL_DEV_COMPANY_ID;
  if (cachedFallbackCompanyId) return cachedFallbackCompanyId;
  await ensureSchema();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { sql } = require("@vercel/postgres") as typeof import("@vercel/postgres");
  const res = await sql`select id::text as id from companies where slug = ${FALLBACK_SLUG} limit 1`;
  const id = res.rows[0]?.id as string | undefined;
  if (!id) throw new Error(`No tenant found for slug "${FALLBACK_SLUG}" — run the backfill script first`);
  cachedFallbackCompanyId = id;
  return id;
}

/**
 * The companyId every data-access call is scoped by. Reads it from the
 * verified session (set at login — see app/api/auth/login/route.ts); falls
 * back to the migrated Archer's Windows tenant only when there's genuinely
 * no session to read (e.g. a build-time render with no request context).
 */
export async function getCurrentCompanyId(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const session = await verifySessionCookieValue(cookieStore.get(authCookieName())?.value);
    if (session?.companyId) return session.companyId;
  } catch {
    // cookies() throws outside a request context (e.g. some build-time paths) — fall through.
  }
  return getFallbackCompanyId();
}

export async function resolveCompanyBySlug(slug: string): Promise<Company | null> {
  if (!isPostgresEnabled()) {
    return slug === FALLBACK_SLUG
      ? { id: LOCAL_DEV_COMPANY_ID, displayName: "Local dev", slug, status: "active" }
      : null;
  }
  await ensureSchema();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { sql } = require("@vercel/postgres") as typeof import("@vercel/postgres");
  const res = await sql`
    select id::text as id, display_name as "displayName", slug, status
    from companies
    where slug = ${slug}
    limit 1
  `;
  return (res.rows[0] as Company | undefined) ?? null;
}
