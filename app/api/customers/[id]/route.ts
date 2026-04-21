import { NextResponse } from "next/server";
import { deleteCustomer, getCustomer, putCustomer } from "@/lib/kv";
import { isIsoDate, parsePositiveInt, parsePricePence, type Customer } from "@/lib/models";

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

  const body = (await req.json().catch(() => null)) as Partial<Customer> | null;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });

  const name = typeof body.name === "string" ? body.name.trim() : existing.name;
  const address =
    typeof body.address === "string" ? body.address.trim() : existing.address;
  const street =
    typeof body.street === "string" ? body.street.trim() : existing.street;
  const phone = typeof body.phone === "string" ? body.phone.trim() : existing.phone;
  const startDate =
    typeof body.startDate === "string" ? body.startDate : existing.startDate;
  const defaultPricePence =
    body.defaultPricePence === undefined
      ? existing.defaultPricePence
      : parsePricePence(body.defaultPricePence);
  const frequencyWeeks =
    body.frequencyWeeks === undefined
      ? existing.frequencyWeeks
      : parsePositiveInt(body.frequencyWeeks);
  const active = typeof body.active === "boolean" ? body.active : existing.active;

  if (!name || !address) {
    return NextResponse.json({ ok: false, error: "Name and address required" }, { status: 400 });
  }
  if (!isIsoDate(startDate)) {
    return NextResponse.json({ ok: false, error: "Invalid start date" }, { status: 400 });
  }
  if (defaultPricePence === null) {
    return NextResponse.json({ ok: false, error: "Invalid price" }, { status: 400 });
  }
  if (!frequencyWeeks) {
    return NextResponse.json({ ok: false, error: "Invalid frequency" }, { status: 400 });
  }

  const updated: Customer = {
    ...existing,
    name,
    address,
    street: street?.length ? street : undefined,
    phone: phone?.length ? phone : undefined,
    startDate,
    defaultPricePence,
    frequencyWeeks,
    active,
  };
  await putCustomer(updated);
  return NextResponse.json({ ok: true, customer: updated });
}

export async function DELETE(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await deleteCustomer(id);
  return NextResponse.json({ ok: true });
}

