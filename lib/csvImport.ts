// Loose, forgiving parser for customer-list pastes — a notebook typed into a
// spreadsheet rarely has clean, consistent headers. Recognizes common header
// variants, tolerates blanks, and never throws: every row gets a best-effort
// guess plus a list of issues so the admin can fix them in a preview grid
// before anything is committed.

export type ParsedCustomerDraft = {
  name: string;
  address: string;
  street: string;
  phone: string;
  pricePounds: string;
  startDate: string;
  frequencyWeeks: string;
  oneOff: boolean;
  notes: string;
  issues: string[];
};

const HEADER_ALIASES: Record<string, string[]> = {
  name: ["name", "customer", "client", "full name", "customer name"],
  address: ["address", "addr", "street address", "full address"],
  street: ["street", "road", "area", "street/area"],
  phone: ["phone", "mobile", "tel", "telephone", "number", "phone number"],
  price: ["price", "£", "cost", "amount", "fee", "price (£)", "price_gbp"],
  startDate: ["start date", "startdate", "start", "first clean", "date", "first visit"],
  frequency: ["frequency", "freq", "weeks", "every", "frequency_weeks", "frequency (weeks)"],
  notes: ["notes", "note", "gate code", "comments", "comment", "gate"],
};

function normalizeHeader(h: string) {
  return h.trim().toLowerCase();
}

function matchHeader(header: string): string | null {
  const norm = normalizeHeader(header);
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(norm)) return field;
  }
  return null;
}

function parseCsvLine(line: string): string[] {
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
    else if (ch === "," || ch === "\t") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/** Accepts ISO (2026-04-22), UK (22/04/2026 or 22-04-2026), falls back to today. */
function normalizeDateLoose(raw: string): { date: string; guessed: boolean } {
  const trimmed = raw.trim();
  if (!trimmed) return { date: todayIso(), guessed: false };

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return { date: trimmed, guessed: false };

  const ukMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(trimmed);
  if (ukMatch) {
    const [, d, m, y] = ukMatch;
    const day = d.padStart(2, "0");
    const month = m.padStart(2, "0");
    if (Number(month) <= 12 && Number(day) <= 31) {
      return { date: `${y}-${month}-${day}`, guessed: false };
    }
  }

  return { date: todayIso(), guessed: true };
}

function parsePriceLoose(raw: string): { pounds: string; guessed: boolean } {
  const trimmed = raw.trim();
  if (!trimmed) return { pounds: "0.00", guessed: true };
  const cleaned = trimmed.replace(/[£$,]/g, "").trim();
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return { pounds: "0.00", guessed: true };
  return { pounds: n.toFixed(2), guessed: false };
}

function parseFrequencyLoose(raw: string): { weeks: string; oneOff: boolean } {
  if (/one.?off/i.test(raw)) return { weeks: "1", oneOff: true };
  const match = raw.match(/\d+/);
  if (!match) return { weeks: "4", oneOff: false };
  return { weeks: match[0], oneOff: false };
}

export function parseCustomerCsv(text: string): {
  rows: ParsedCustomerDraft[];
  unmatchedHeaders: string[];
} {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { rows: [], unmatchedHeaders: [] };

  const headerCols = parseCsvLine(lines[0]);
  const fieldByIndex = headerCols.map(matchHeader);
  const unmatchedHeaders = headerCols.filter((_, i) => !fieldByIndex[i]);

  const rows: ParsedCustomerDraft[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.every((c) => !c.trim())) continue;

    const raw: Record<string, string> = {};
    fieldByIndex.forEach((field, idx) => {
      if (field) raw[field] = (cols[idx] ?? "").trim();
    });

    const issues: string[] = [];
    const name = raw.name ?? "";
    const address = raw.address ?? "";
    if (!name) issues.push("Missing name");
    if (!address) issues.push("Missing address");

    const { pounds, guessed: priceGuessed } = parsePriceLoose(raw.price ?? "");
    if (priceGuessed && raw.price) issues.push("Couldn't read price — check it");

    const { date: startDate, guessed: dateGuessed } = normalizeDateLoose(raw.startDate ?? "");
    if (dateGuessed) issues.push("Couldn't read start date — defaulted to today");

    const { weeks: frequencyWeeks, oneOff } = parseFrequencyLoose(raw.frequency ?? "");

    rows.push({
      name,
      address,
      street: raw.street ?? "",
      phone: raw.phone ?? "",
      pricePounds: pounds,
      startDate,
      frequencyWeeks,
      oneOff,
      notes: raw.notes ?? "",
      issues,
    });
  }

  return { rows, unmatchedHeaders };
}
