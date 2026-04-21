import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { getCustomersByIds, listCustomerIds } from "@/lib/kv";

export const dynamic = "force-dynamic";

function formatMoneyPounds(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

export default async function CustomersPage() {
  const ids = await listCustomerIds();
  const customers = await getCustomersByIds(ids);
  customers.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <AppHeader
        title="Customers"
        right={
          <Link
            href="/customers/new"
            className="rounded-full bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Add
          </Link>
        }
      />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        {customers.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              No customers yet.
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Tap “Add” to create your first customer.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
            {customers.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/customers/${c.id}`}
                  className="block px-4 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
                        {c.name}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {c.address}
                      </p>
                      {c.phone ? (
                        <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {c.phone}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {formatMoneyPounds(c.defaultPricePence)}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        Every {c.frequencyWeeks}w
                      </p>
                      <span
                        className={[
                          "mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                          c.active
                            ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                            : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
                        ].join(" ")}
                      >
                        {c.active ? "Active" : "Paused"}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

