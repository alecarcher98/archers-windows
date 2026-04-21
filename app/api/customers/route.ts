import { NextResponse } from "next/server";
import { getCustomersByIds, listCustomerIds, putCustomer } from "@/lib/kv";
import { isIsoDate, parsePositiveInt, parsePricePence, type Customer } from "@/lib/models";

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

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const street = typeof body.street === "string" ? body.street.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;
  const startDate = typeof body.startDate === "string" ? body.startDate : "";
  const defaultPricePence = parsePricePence(body.defaultPricePence);
  const frequencyWeeks = parsePositiveInt(body.frequencyWeeks);
  const active = typeof body.active === "boolean" ? body.active : true;

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

  const customer: Customer = {
    id: newId(),
    name,
    address,
    street: street.length ? street : undefined,
    phone: phone?.length ? phone : undefined,
    defaultPricePence,
    startDate,
    frequencyWeeks,
    active,
  };

  await putCustomer(customer);
  return NextResponse.json({ ok: true, customer }, { status: 201 });
}

