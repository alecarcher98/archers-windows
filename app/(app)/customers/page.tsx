import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { CustomersClient } from "@/components/CustomersClient";
import { PlusIcon } from "@/components/Icons";
import { getCustomersByIds, listCustomerIds } from "@/lib/kv";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const ids = await listCustomerIds();
  const customers = await getCustomersByIds(ids);
  customers.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <AppHeader
        title="Clients"
        right={
          <Link
            href="/customers/new"
            className="group inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 pl-3 pr-4 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:shadow-lg hover:shadow-indigo-600/30 active:scale-[0.97]"
          >
            <PlusIcon className="h-4 w-4 transition group-hover:rotate-90" />
            New client
          </Link>
        }
      />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        {customers.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-zinc-300 bg-white/60 p-10 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-950/60">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <PlusIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                No clients yet
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Add your first client to start building rounds, or import a CSV from your old
                system.
              </p>
            </div>
            <Link
              href="/customers/new"
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 active:scale-[0.97]"
            >
              <PlusIcon className="h-4 w-4" />
              Add your first client
            </Link>
          </div>
        ) : (
          <CustomersClient customers={customers} />
        )}
      </main>
    </>
  );
}
