import { NextResponse } from "next/server";
import { parseCustomerBody } from "@/lib/customers";
import { getCustomersByIds, listCustomerIds, putCustomer } from "@/lib/kv";
import type { Customer } from "@/lib/models";

function newId() {
  return crypto.randomUUID();
}

export async function GET() {
  const ids = await listCustomerIds();
  const customers = await getCustomersByIds(ids);
  customers.sort((a, b) => a.name.localeCompare(b.name));
  return NextResponse.json({ ok: true, customers });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Partial<Customer> | null;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });

  const { customer, error } = parseCustomerBody({ ...body, id: newId() }, null);
  if (!customer) {
    return NextResponse.json({ ok: false, error: error ?? "Invalid" }, { status: 400 });
  }

  await putCustomer(customer);
  return NextResponse.json({ ok: true, customer }, { status: 201 });
}
