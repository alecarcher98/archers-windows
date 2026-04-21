import type { Customer, DayRecord, IsoDate, OneOffJob } from "@/lib/models";

export type ScheduledJob = {
  jobId: `cust:${string}`;
  kind: "scheduled";
  customer: Customer;
  pricePence: number;
};

export type OneOffListedJob = {
  jobId: `oneoff:${string}`;
  kind: "oneoff";
  oneOff: OneOffJob;
  pricePence: number;
};

export type ListedJob = (ScheduledJob | OneOffListedJob) & {
  cleaned: boolean;
  collected: boolean;
  visitNote: string;
};

function tz() {
  return process.env.APP_TZ || "Europe/London";
}

export function isoToday(): IsoDate {
  return isoForDate(new Date(), tz());
}

export function isoForDate(d: Date, timeZone: string): IsoDate {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA produces YYYY-MM-DD
  return fmt.format(d) as IsoDate;
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const dt = isoToUtcNoon(date);
  dt.setUTCDate(dt.getUTCDate() + days);
  return utcNoonToIso(dt);
}

export function isoToUtcNoon(date: IsoDate) {
  const [y, m, d] = date.split("-").map((x) => Number(x));
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
}

export function utcNoonToIso(dt: Date): IsoDate {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}` as IsoDate;
}

export function weeksBetween(start: IsoDate, target: IsoDate) {
  const s = isoToUtcNoon(start).getTime();
  const t = isoToUtcNoon(target).getTime();
  const diffDays = Math.floor((t - s) / 86_400_000);
  return Math.floor(diffDays / 7);
}

export function daysBetween(start: IsoDate, target: IsoDate) {
  const s = isoToUtcNoon(start).getTime();
  const t = isoToUtcNoon(target).getTime();
  return Math.floor((t - s) / 86_400_000);
}

export function dueCustomersOnDate(customers: Customer[], date: IsoDate) {
  return customers.filter((c) => {
    if (!c.active) return false;
    const diffDays = daysBetween(c.startDate, date);
    if (diffDays < 0) return false;
    const periodDays = 7 * c.frequencyWeeks;
    return diffDays % periodDays === 0;
  });
}

export function defaultJobIdForCustomer(id: string) {
  return `cust:${id}` as const;
}

export function assembleDayJobs({
  date,
  customers,
  day,
}: {
  date: IsoDate;
  customers: Customer[];
  day: DayRecord;
}) {
  const due = dueCustomersOnDate(customers, date);
  const scheduledJobs: ScheduledJob[] = due.map((customer) => ({
    jobId: defaultJobIdForCustomer(customer.id),
    kind: "scheduled",
    customer,
    pricePence: customer.defaultPricePence,
  }));

  const oneOffJobs: OneOffListedJob[] = Object.values(day.oneOff ?? {}).map((oneOff) => ({
    jobId: oneOff.id as `oneoff:${string}`,
    kind: "oneoff",
    oneOff,
    pricePence: oneOff.pricePence,
  }));

  const jobById = new Map<string, ScheduledJob | OneOffListedJob>();
  for (const j of scheduledJobs) jobById.set(j.jobId, j);
  for (const j of oneOffJobs) jobById.set(j.jobId, j);

  const ordered = (day.orderedJobIds ?? []).filter((id) => jobById.has(id));

  // Append any missing jobs deterministically
  const missing = Array.from(jobById.keys()).filter((id) => !ordered.includes(id));
  missing.sort((a, b) => {
    const ja = jobById.get(a);
    const jb = jobById.get(b);
    const sa =
      ja?.kind === "scheduled" ? ja.customer.street ?? "" : ja?.kind === "oneoff" ? "" : "";
    const sb =
      jb?.kind === "scheduled" ? jb.customer.street ?? "" : jb?.kind === "oneoff" ? "" : "";
    if (sa !== sb) return sa.localeCompare(sb);
    const na =
      ja?.kind === "scheduled" ? ja.customer.name : ja?.kind === "oneoff" ? ja.oneOff.name : a;
    const nb =
      jb?.kind === "scheduled" ? jb.customer.name : jb?.kind === "oneoff" ? jb.oneOff.name : b;
    return na.localeCompare(nb);
  });

  const finalOrder = [...ordered, ...missing];

  const listed: ListedJob[] = finalOrder.map((id) => {
    const base = jobById.get(id);
    if (!base) {
      // Should be impossible due to filtering above, but keep it safe.
      return {
        jobId: id as never,
        kind: "oneoff",
        oneOff: { id: id as never, name: "Unknown", address: "", pricePence: 0 },
        pricePence: 0,
        cleaned: false,
        collected: false,
        visitNote: "",
      };
    }
    const state = day.jobState?.[id];
    const cleaned = typeof state?.cleaned === "boolean" ? state.cleaned : Boolean(state?.completed);
    const collected =
      typeof state?.collected === "boolean" ? state.collected : Boolean(state?.cashCollected);
    return {
      ...(base as ScheduledJob | OneOffListedJob),
      cleaned,
      collected,
      visitNote: typeof state?.visitNote === "string" ? state.visitNote : "",
    };
  });

  return { jobs: listed, finalOrder };
}

