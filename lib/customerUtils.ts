import type { Customer, IsoDate } from "@/lib/models";

export function isCustomerPausedOnDate(c: Customer, date: IsoDate) {
  if (!c.pausedUntil) return false;
  return date < c.pausedUntil;
}

export function isFirstVisitOnDate(c: Customer, date: IsoDate) {
  return c.startDate === date;
}

export function normalizeAddressKey(address: string) {
  return address.trim().toLowerCase().replace(/\s+/g, " ");
}

export function findDuplicateWarnings(
  customers: Customer[],
  candidate: { name: string; address: string; id?: string },
) {
  const key = normalizeAddressKey(candidate.address);
  const warnings: string[] = [];
  for (const c of customers) {
    if (candidate.id && c.id === candidate.id) continue;
    if (normalizeAddressKey(c.address) === key) {
      warnings.push(`Same address as ${c.name}`);
    } else if (
      c.name.trim().toLowerCase() === candidate.name.trim().toLowerCase() &&
      candidate.name.trim().length > 2
    ) {
      warnings.push(`Same name as ${c.address}`);
    }
  }
  return warnings;
}

export function customerToCsvRow(c: Customer) {
  return [
    c.id,
    c.name,
    c.address,
    c.street ?? "",
    c.phone ?? "",
    (c.defaultPricePence / 100).toFixed(2),
    c.startDate,
    String(c.frequencyWeeks),
    c.active ? "1" : "0",
    (c.notes ?? "").replaceAll('"', '""'),
    c.pausedUntil ?? "",
    c.oneOff ? "1" : "0",
  ];
}

export const CUSTOMER_CSV_HEADER =
  "id,name,address,street,phone,price_gbp,start_date,frequency_weeks,active,notes,paused_until,one_off";

/** Exports made before the one_off column existed — still accepted on import. */
export const LEGACY_CUSTOMER_CSV_HEADER =
  "id,name,address,street,phone,price_gbp,start_date,frequency_weeks,active,notes,paused_until";
