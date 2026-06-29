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
      <AppHeader title={isNew ? "Add client" : "Edit client"} />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        {isNew ? (
          <CustomerForm mode="new" />
        ) : customer ? (
          <CustomerForm mode="edit" customer={customer} />
        ) : (
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-medium text-zinc-900">Client not found.</p>
            <p className="mt-1 text-sm text-zinc-500">
              They may have been removed from the database.
            </p>
          </div>
        )}
      </main>
    </>
  );
}

