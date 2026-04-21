import type { Customer, IsoDate, OneOffJob } from "@/lib/models";
import { getCustomersByIds, getDay, listCustomerIds } from "@/lib/kv";
import { addDays, isoToUtcNoon, utcNoonToIso } from "@/lib/schedule";

export type OverdueItem = {
  jobId: string;
  sourceDate: IsoDate; // date it was cleaned (but not collected)
  title: string;
  subtitle: string;
  phone?: string;
  pricePence: number;
  kind: "scheduled" | "oneoff";
};

function isCleaned(state: unknown): boolean {
  if (!state || typeof state !== "object") return false;
  const s = state as { cleaned?: unknown; completed?: unknown };
  if (typeof s.cleaned === "boolean") return s.cleaned;
  return Boolean(s.completed);
}

function isCollected(state: unknown): boolean {
  if (!state || typeof state !== "object") return false;
  const s = state as { collected?: unknown; cashCollected?: unknown };
  if (typeof s.collected === "boolean") return s.collected;
  return Boolean(s.cashCollected);
}

export async function listOverdueForToday(today: IsoDate, lookbackDays = 60): Promise<OverdueItem[]> {
  const ids = await listCustomerIds();
  const customers = await getCustomersByIds(ids);
  const byCustomerId = new Map<string, Customer>(customers.map((c) => [c.id, c]));

  const seen = new Set<string>();
  const overdue: OverdueItem[] = [];

  const todayT = isoToUtcNoon(today).getTime();
  const start = addDays(today, -lookbackDays);
  let t = isoToUtcNoon(start).getTime();

  // Iterate forward, but record the latest cleaned-not-collected per jobId
  const latestByJobId = new Map<string, { date: IsoDate; oneOff?: OneOffJob }>();

  for (; t < todayT; t += 86_400_000) {
    const date = utcNoonToIso(new Date(t));
    const day = await getDay(date);
    for (const [jobId, st] of Object.entries(day.jobState ?? {})) {
      if (!isCleaned(st)) continue;
      if (isCollected(st)) {
        latestByJobId.delete(jobId);
        continue;
      }
      latestByJobId.set(jobId, { date, oneOff: day.oneOff?.[jobId] });
    }
  }

  for (const [jobId, info] of latestByJobId.entries()) {
    if (seen.has(jobId)) continue;
    seen.add(jobId);

    if (jobId.startsWith("cust:")) {
      const cid = jobId.slice("cust:".length);
      const c = byCustomerId.get(cid);
      if (!c) continue;
      overdue.push({
        jobId,
        sourceDate: info.date,
        title: c.name,
        subtitle: c.address,
        phone: c.phone,
        pricePence: c.defaultPricePence,
        kind: "scheduled",
      });
    } else if (jobId.startsWith("oneoff:")) {
      const one = info.oneOff;
      if (!one) continue;
      overdue.push({
        jobId,
        sourceDate: info.date,
        title: one.name,
        subtitle: one.address,
        phone: one.phone,
        pricePence: one.pricePence,
        kind: "oneoff",
      });
    }
  }

  overdue.sort((a, b) => a.sourceDate.localeCompare(b.sourceDate));
  return overdue;
}

