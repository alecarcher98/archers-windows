import { ensureSchema, isPostgresEnabled } from "@/lib/db";

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
 * Temporary scaffolding: until the session carries a companyId, every
 * request resolves to the migrated Archer's Windows tenant. Safe while
 * exactly one tenant exists — replaced once sessions carry identity.
 */
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

export async function getCurrentCompanyId(): Promise<string> {
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
