import { NextResponse } from "next/server";
import { parseCustomerBody } from "@/lib/customers";
import { deleteCustomer, getCustomer, putCustomer } from "@/lib/kv";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const customer = await getCustomer(id);
  if (!customer) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, customer });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const existing = await getCustomer(id);
  if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });

  const { customer, error } = parseCustomerBody({ ...body, id } as never, existing);
  if (!customer) {
    return NextResponse.json({ ok: false, error: error ?? "Invalid" }, { status: 400 });
  }

  await putCustomer(customer);
  return NextResponse.json({ ok: true, customer });
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await deleteCustomer(id);
  return NextResponse.json({ ok: true });
}
