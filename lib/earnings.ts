import { getCustomersByIds, getDay, listCustomerIds } from "@/lib/kv";
import type { Customer, IsoDate } from "@/lib/models";
import { addDays, isoToUtcNoon, utcNoonToIso } from "@/lib/schedule";

export type EarningsResult = {
  totalPence: number;
  days: Array<{ date: IsoDate; totalPence: number }>;
};

function startOfWeekMonday(date: IsoDate) {
  const dt = isoToUtcNoon(date);
  const dow = dt.getUTCDay(); // 0=Sun
  const diff = (dow + 6) % 7; // Mon=0
  dt.setUTCDate(dt.getUTCDate() - diff);
  return utcNoonToIso(dt);
}

export function weekRangeFor(date: IsoDate) {
  const start = startOfWeekMonday(date);
  const end = addDays(start, 6);
  return { start, end };
}

export async function sumCashCollected(start: IsoDate, end: IsoDate): Promise<EarningsResult> {
  const startT = isoToUtcNoon(start).getTime();
  const endT = isoToUtcNoon(end).getTime();
  if (endT < startT) return { totalPence: 0, days: [] };

  const ids = await listCustomerIds();
  const customers = await getCustomersByIds(ids);
  const byId = new Map<string, Customer>(customers.map((c) => [c.id, c]));

  const days: Array<{ date: IsoDate; totalPence: number }> = [];
  let totalPence = 0;

  for (let t = startT; t <= endT; t += 86_400_000) {
    const date = utcNoonToIso(new Date(t));
    const day = await getDay(date);
    let dayTotal = 0;

    for (const [jobId, st] of Object.entries(day.jobState ?? {})) {
      const collected =
        typeof st?.collected === "boolean" ? st.collected : Boolean(st?.cashCollected);
      if (!collected) continue;
      if (jobId.startsWith("cust:")) {
        const cid = jobId.slice("cust:".length);
        const c = byId.get(cid);
        if (c) dayTotal += c.defaultPricePence;
      } else if (jobId.startsWith("oneoff:")) {
        const one = day.oneOff?.[jobId];
        if (one) dayTotal += one.pricePence;
      }
    }

    if (dayTotal !== 0) days.push({ date, totalPence: dayTotal });
    totalPence += dayTotal;
  }

  return { totalPence, days };
}

