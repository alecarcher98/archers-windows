import { AppHeader } from "@/components/AppHeader";
import { CustomerForm } from "@/components/CustomerForm";
import { getCustomer } from "@/lib/kv";

export const dynamic = "force-dynamic";

export default async function CustomerEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";
  const customer = isNew ? null : await getCustomer(id);

  return (
    <>
      <AppHeader title={isNew ? "Add customer" : "Edit customer"} />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        {isNew ? (
          <CustomerForm mode="new" />
        ) : customer ? (
          <CustomerForm mode="edit" customer={customer} />
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Customer not found.
            </p>
          </div>
        )}
      </main>
    </>
  );
}

