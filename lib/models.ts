export type IsoDate = `${number}-${number}-${number}`;

export type Customer = {
  id: string;
  name: string;
  address: string;
  street?: string; // used for grouping/aligning nearby houses
  phone?: string;
  defaultPricePence: number;
  startDate: IsoDate;
  frequencyWeeks: number;
  active: boolean;
};

export type OneOffJob = {
  id: string; // oneoff:{uuid}
  name: string;
  address: string;
  phone?: string;
  pricePence: number;
};

export type DayJobState = {
  // New preferred fields:
  cleaned?: boolean;
  collected?: boolean;
  // Backward compatible (older data / older builds):
  completed?: boolean;
  cashCollected?: boolean;
  visitNote?: string;
};

export type DayRecord = {
  date: IsoDate;
  orderedJobIds: string[];
  jobState: Record<string, DayJobState>;
  oneOff: Record<string, OneOffJob>;
};

export function isIsoDate(s: string): s is IsoDate {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function normalizePhone(phone: string) {
  const trimmed = phone.trim();
  return trimmed.length ? trimmed : undefined;
}

export function parsePricePence(input: unknown) {
  if (typeof input === "number" && Number.isInteger(input) && input >= 0) return input;
  if (typeof input === "string") {
    const n = Number(input);
    if (Number.isFinite(n)) return Math.round(n);
  }
  return null;
}

export function parsePositiveInt(input: unknown) {
  if (typeof input === "number" && Number.isInteger(input) && input > 0) return input;
  if (typeof input === "string") {
    const n = Number(input);
    if (Number.isFinite(n) && Number.isInteger(n) && n > 0) return n;
  }
  return null;
}

