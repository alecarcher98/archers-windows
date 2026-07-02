export type IsoDate = `${number}-${number}-${number}`;

export type PriceHistoryEntry = {
  effectiveDate: IsoDate;
  pricePence: number;
  changedAt: number;
};

export type Customer = {
  id: string;
  name: string;
  address: string;
  street?: string;
  phone?: string;
  defaultPricePence: number;
  startDate: IsoDate;
  frequencyWeeks: number;
  /** Cleaned once on startDate only, ignoring frequencyWeeks */
  oneOff?: boolean;
  active: boolean;
  /** Permanent notes (gate codes, dogs, etc.) */
  notes?: string;
  /** Skip scheduling on and before this date; resume next day */
  pausedUntil?: IsoDate;
  priceHistory?: PriceHistoryEntry[];
};

export type OneOffJob = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  pricePence: number;
};

export type PaymentType = "cash" | "bank" | "card" | "unpaid";

export type DayJobState = {
  cleaned?: boolean;
  collected?: boolean;
  completed?: boolean;
  cashCollected?: boolean;
  visitNote?: string;
  smsSentAt?: number;
  paymentType?: PaymentType;
  /** Not home — job skipped for this day */
  skipped?: boolean;
};

export type AppSettings = {
  businessName: string;
  smsTemplate: string;
  /** Simpler single-column day UI */
  compactMode?: boolean;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  businessName: "RoundMate",
  smsTemplate: `Good {{greeting}},
Your clean has been completed on {{todayDate}} for the value of {{houseValue}}
Thanks,
{{businessName}}`,
  compactMode: false,
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

export function isPaymentType(s: string): s is PaymentType {
  return s === "cash" || s === "bank" || s === "card" || s === "unpaid";
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
