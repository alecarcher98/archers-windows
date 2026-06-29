import { NextResponse } from "next/server";
import { getCompanyById } from "@/lib/admin";
import { parseCustomerBody } from "@/lib/customers";
import { putCustomer } from "@/lib/kv";
import type { Customer } from "@/lib/models";

type DraftInput = {
  name?: unknown;
  address?: unknown;
  street?: unknown;
  phone?: unknown;
  pricePounds?: unknown;
  startDate?: unknown;
  frequencyWeeks?: unknown;
  oneOff?: unknown;
  notes?: unknown;
};

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: companyId } = await ctx.params;
    const company = await getCompanyById(companyId);
    if (!company) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const body = (await req.json().catch(() => null)) as { customers?: DraftInput[] } | null;
    if (!body || !Array.isArray(body.customers)) {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const created: Customer[] = [];
    const errors: string[] = [];

    for (let i = 0; i < body.customers.length; i++) {
      const draft = body.customers[i];
      const pricePounds = typeof draft.pricePounds === "string" ? draft.pricePounds : "0";
      const defaultPricePence = Math.round(Number(pricePounds.replaceAll(",", ".")) * 100);

      const { customer, error } = parseCustomerBody(
        {
          id: crypto.randomUUID(),
          name: typeof draft.name === "string" ? draft.name : "",
          address: typeof draft.address === "string" ? draft.address : "",
          street: typeof draft.street === "string" ? draft.street : "",
          phone: typeof draft.phone === "string" ? draft.phone : "",
          defaultPricePence: Number.isFinite(defaultPricePence) ? defaultPricePence : 0,
          startDate: typeof draft.startDate === "string" ? draft.startDate : "",
          frequencyWeeks: Number(draft.frequencyWeeks) || 4,
          oneOff: Boolean(draft.oneOff),
          notes: typeof draft.notes === "string" ? draft.notes : "",
          active: true,
        } as never,
        null,
      );

      if (!customer) {
        errors.push(`Row ${i + 1}: ${error ?? "invalid"}`);
        continue;
      }

      await putCustomer(customer, companyId);
      created.push(customer);
    }

    return NextResponse.json({ ok: true, created: created.length, errors });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to import customers";
    console.error("[admin customers POST]", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
