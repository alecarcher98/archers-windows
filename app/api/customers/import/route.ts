import { NextResponse } from "next/server";
import { CUSTOMER_CSV_HEADER, LEGACY_CUSTOMER_CSV_HEADER } from "@/lib/customerUtils";
import { getCustomersByIds, listCustomerIds, putCustomer } from "@/lib/kv";
import { isIsoDate, type Customer } from "@/lib/models";

export async function POST(req: Request) {
  const text = await req.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return NextResponse.json({ ok: false, error: "CSV is empty" }, { status: 400 });
  }

  const header = lines[0].trim();
  if (header !== CUSTOMER_CSV_HEADER && header !== LEGACY_CUSTOMER_CSV_HEADER) {
    return NextResponse.json(
      { ok: false, error: `Expected header: ${CUSTOMER_CSV_HEADER}` },
      { status: 400 },
    );
  }

  let imported = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 8) {
      errors.push(`Row ${i + 1}: not enough columns`);
      continue;
    }
    const [
      id,
      name,
      address,
      street,
      phone,
      priceGbp,
      startDate,
      frequencyWeeks,
      active,
      notes,
      pausedUntil,
      oneOff,
    ] = cols;

    if (!name?.trim() || !address?.trim()) {
      errors.push(`Row ${i + 1}: name and address required`);
      continue;
    }
    if (!isIsoDate(startDate)) {
      errors.push(`Row ${i + 1}: invalid start date`);
      continue;
    }

    const pounds = Number(priceGbp);
    const defaultPricePence = Number.isFinite(pounds) ? Math.round(pounds * 100) : 0;
    const freq = Number(frequencyWeeks);
    if (!Number.isFinite(freq) || freq <= 0) {
      errors.push(`Row ${i + 1}: invalid frequency`);
      continue;
    }

    const customer: Customer = {
      id: id?.trim() || crypto.randomUUID(),
      name: name.trim(),
      address: address.trim(),
      street: street?.trim() || undefined,
      phone: phone?.trim() || undefined,
      defaultPricePence,
      startDate,
      frequencyWeeks: Math.round(freq),
      oneOff: oneOff === "1" || oneOff?.toLowerCase() === "true",
      active: active === "1" || active?.toLowerCase() === "true",
      notes: notes?.trim() || undefined,
      pausedUntil: pausedUntil && isIsoDate(pausedUntil) ? pausedUntil : undefined,
    };

    await putCustomer(customer);
    imported += 1;
  }

  const ids = await listCustomerIds();
  const total = (await getCustomersByIds(ids)).length;

  return NextResponse.json({ ok: true, imported, total, errors });
}

function parseCsvLine(line: string) {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}
