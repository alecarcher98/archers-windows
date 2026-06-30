import Link from "next/link";
import { listCompaniesWithStats } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const companies = await listCompaniesWithStats();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-zinc-900">Companies</h1>
        <Link
          href="/admin/companies/new"
          className="h-10 rounded-full bg-[var(--brand)] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-dark)] inline-flex items-center"
        >
          New company
        </Link>
      </div>

      {companies.length === 0 ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-zinc-600">No companies yet.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {companies.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-zinc-900">{c.displayName}</p>
                <p className="mt-0.5 text-sm text-zinc-500">
                  /{c.slug} · {c.customerCount} customer{c.customerCount === 1 ? "" : "s"} ·
                  since {c.createdAt}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0 sm:items-center">
                <a
                  href={`/c/${c.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 rounded-full border border-zinc-200 bg-white px-3 text-center text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 inline-flex items-center justify-center"
                >
                  Open
                </a>
                <Link
                  href={`/admin/companies/${c.id}`}
                  className="h-9 rounded-full bg-zinc-900 px-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 inline-flex items-center justify-center"
                >
                  Manage
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
