import { NextResponse } from "next/server";
import { getCompanyById } from "@/lib/admin";
import { parseCustomerBody } from "@/lib/customers";
import { deleteCustomer, getCustomer, putCustomer } from "@/lib/kv";

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string; customerId: string }> },
) {
  try {
    const { id: companyId, customerId } = await ctx.params;
    const company = await getCompanyById(companyId);
    if (!company) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const existing = await getCustomer(customerId, companyId);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Customer not found" }, { status: 404 });
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });

    const { customer, error } = parseCustomerBody({ ...body, id: customerId } as never, existing);
    if (!customer) {
      return NextResponse.json({ ok: false, error: error ?? "Invalid" }, { status: 400 });
    }

    await putCustomer(customer, companyId);
    return NextResponse.json({ ok: true, customer });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update customer";
    console.error("[admin customer PUT]", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; customerId: string }> },
) {
  try {
    const { id: companyId, customerId } = await ctx.params;
    const company = await getCompanyById(companyId);
    if (!company) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    await deleteCustomer(customerId, companyId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete customer";
    console.error("[admin customer DELETE]", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
