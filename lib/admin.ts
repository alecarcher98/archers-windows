import { ensureSchema, isPostgresEnabled } from "@/lib/db";
import type { Company } from "@/lib/tenant";

// Anything that's already a real top-level route (or could be confused for
// one) is off-limits as a company slug.
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "c",
  "demo",
  "login",
  "marketing",
  "archers",
  "today",
  "tomorrow",
  "week",
  "schedule",
  "customers",
  "earnings",
  "settings",
  "review",
  "day",
  "offline",
  "favicon",
  "robots",
  "sitemap",
  "icons",
  "images",
]);

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function validateSlug(slug: string): string | null {
  if (!slug) return "Slug is required";
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return "Slug can only contain lowercase letters, numbers and hyphens";
  }
  if (RESERVED_SLUGS.has(slug)) return `"${slug}" is a reserved word`;
  return null;
}

export type CompanyWithStats = Company & { customerCount: number; createdAt: string };

export async function listCompaniesWithStats(): Promise<CompanyWithStats[]> {
  if (!isPostgresEnabled()) return [];
  await ensureSchema();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { sql } = require("@vercel/postgres") as typeof import("@vercel/postgres");
  const res = await sql`
    select
      companies.id::text as id,
      companies.display_name as "displayName",
      companies.slug,
      companies.status,
      to_char(companies.created_at, 'YYYY-MM-DD') as "createdAt",
      count(customers.id)::int as "customerCount"
    from companies
    left join customers on customers.company_id = companies.id
    group by companies.id, companies.display_name, companies.slug, companies.status, companies.created_at
    order by companies.created_at desc
  `;
  return res.rows as CompanyWithStats[];
}

export async function getCompanyById(id: string): Promise<Company | null> {
  if (!isPostgresEnabled()) return null;
  await ensureSchema();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { sql } = require("@vercel/postgres") as typeof import("@vercel/postgres");
  const res = await sql`
    select id::text as id, display_name as "displayName", slug, status
    from companies
    where id = ${id}::uuid
    limit 1
  `;
  return (res.rows[0] as Company | undefined) ?? null;
}

export async function createCompany(input: {
  id: string;
  displayName: string;
  slug: string;
  brandColor?: string;
}): Promise<Company> {
  await ensureSchema();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { sql } = require("@vercel/postgres") as typeof import("@vercel/postgres");
  await sql`
    insert into companies (id, display_name, slug, brand_color)
    values (${input.id}::uuid, ${input.displayName}, ${input.slug}, ${input.brandColor ?? null})
  `;
  return { id: input.id, displayName: input.displayName, slug: input.slug, status: "active" };
}

export async function updateCompany(
  id: string,
  input: { displayName?: string; brandColor?: string | null },
): Promise<void> {
  await ensureSchema();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { sql } = require("@vercel/postgres") as typeof import("@vercel/postgres");
  if (typeof input.displayName === "string" && input.displayName.trim()) {
    await sql`update companies set display_name = ${input.displayName.trim()} where id = ${id}::uuid`;
  }
  if (input.brandColor !== undefined) {
    await sql`update companies set brand_color = ${input.brandColor} where id = ${id}::uuid`;
  }
}

export async function slugExists(slug: string): Promise<boolean> {
  if (!isPostgresEnabled()) return false;
  await ensureSchema();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { sql } = require("@vercel/postgres") as typeof import("@vercel/postgres");
  const res = await sql`select 1 from companies where slug = ${slug} limit 1`;
  return res.rows.length > 0;
}

const TABLES_WITH_COMPANY_ID = ["app_settings", "moves", "removed", "days", "customers"];

/**
 * Permanently deletes a company and every row that belongs to it — there's
 * no soft-delete here, this is the real thing. Runs in one transaction (one
 * connection checked out via sql.connect(), not the pooled `sql` tag) so
 * it's all-or-nothing: either the whole company is gone, or none of it is.
 */
export async function deleteCompanyCascade(companyId: string): Promise<void> {
  await ensureSchema();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { sql } = require("@vercel/postgres") as typeof import("@vercel/postgres");
  const client = await sql.connect();
  try {
    await client.query("begin");
    for (const table of TABLES_WITH_COMPANY_ID) {
      await client.query(`delete from ${table} where company_id = $1`, [companyId]);
    }
    await client.query("delete from companies where id = $1", [companyId]);
    await client.query("commit");
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}
