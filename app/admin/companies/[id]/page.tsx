import { notFound } from "next/navigation";
import { getCompanyById } from "@/lib/admin";
import { getCustomersByIds, listCustomerIds } from "@/lib/kv";
import { AdminCompanyManager } from "@/components/admin/AdminCompanyManager";

export const dynamic = "force-dynamic";

export default async function AdminCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompanyById(id);
  if (!company) notFound();

  const ids = await listCustomerIds(id);
  const customers = await getCustomersByIds(ids, id);
  customers.sort((a, b) => a.name.localeCompare(b.name));

  return <AdminCompanyManager company={company} initialCustomers={customers} />;
}
