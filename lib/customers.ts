import { isIsoDate, type Customer, IsoDate, PriceHistoryEntry } from "@/lib/models";
import { isoToday } from "@/lib/schedule";

export function applyPriceHistory(
  existing: Customer | null,
  nextPricePence: number,
  effectiveDate: IsoDate = isoToday(),
): PriceHistoryEntry[] | undefined {
  const prev = existing?.priceHistory ?? [];
  if (!existing || existing.defaultPricePence === nextPricePence) {
    return prev.length ? prev : existing?.priceHistory;
  }
  return [...prev, { effectiveDate, pricePence: nextPricePence, changedAt: Date.now() }];
}

export function parseCustomerBody(
  body: Partial<Customer>,
  existing?: Customer | null,
): { customer: Customer | null; error?: string } {
  const name = typeof body.name === "string" ? body.name.trim() : existing?.name ?? "";
  const address =
    typeof body.address === "string" ? body.address.trim() : existing?.address ?? "";
  const street =
    typeof body.street === "string" ? body.street.trim() : existing?.street ?? "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : existing?.phone ?? "";
  const startDate =
    typeof body.startDate === "string" ? body.startDate : (existing?.startDate ?? "");
  const defaultPricePence =
    body.defaultPricePence === undefined
      ? (existing?.defaultPricePence ?? null)
      : typeof body.defaultPricePence === "number"
        ? body.defaultPricePence
        : Number(body.defaultPricePence);
  const frequencyWeeks =
    body.frequencyWeeks === undefined
      ? existing?.frequencyWeeks
      : Number(body.frequencyWeeks);
  const active = typeof body.active === "boolean" ? body.active : (existing?.active ?? true);
  const notes = typeof body.notes === "string" ? body.notes.trim() : existing?.notes ?? "";
  let pausedUntil: IsoDate | undefined = existing?.pausedUntil;
  if (typeof body.pausedUntil === "string") {
    const pausedRaw = body.pausedUntil.trim();
    if (!pausedRaw) pausedUntil = undefined;
    else if (isIsoDate(pausedRaw)) pausedUntil = pausedRaw;
    else return { customer: null, error: "Invalid paused until date" };
  }

  if (!name || !address) return { customer: null, error: "Name and address required" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return { customer: null, error: "Invalid start date" };
  }
  if (defaultPricePence === null || !Number.isFinite(defaultPricePence) || defaultPricePence < 0) {
    return { customer: null, error: "Invalid price" };
  }
  if (!frequencyWeeks || !Number.isFinite(frequencyWeeks) || frequencyWeeks <= 0) {
    return { customer: null, error: "Invalid frequency" };
  }

  const priceHistory = applyPriceHistory(existing ?? null, Math.round(defaultPricePence));

  const customer: Customer = {
    id: existing?.id ?? (typeof body.id === "string" ? body.id : ""),
    name,
    address,
    street: street.length ? street : undefined,
    phone: phone.length ? phone : undefined,
    defaultPricePence: Math.round(defaultPricePence),
    startDate: startDate as IsoDate,
    frequencyWeeks: Math.round(frequencyWeeks),
    active,
    notes: notes.length ? notes : undefined,
    pausedUntil: pausedUntil as IsoDate | undefined,
    priceHistory,
  };

  if (!customer.id) return { customer: null, error: "Missing id" };

  return { customer };
}
