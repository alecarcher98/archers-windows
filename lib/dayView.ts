import type { Customer, IsoDate } from "@/lib/models";
import {
  getCustomersByIds,
  getDay,
  getMove,
  listCustomerIds,
  listMovesTo,
  listRemovedJobIds,
} from "@/lib/kv";
import { assembleDayJobs } from "@/lib/schedule";

export async function buildDayView(date: IsoDate) {
  const ids = await listCustomerIds();
  const customers = await getCustomersByIds(ids);
  const day = await getDay(date);

  const removedIds = new Set(await listRemovedJobIds());

  // Moved-in jobs (only scheduled jobs supported here; one-offs remain day-bound)
  const movedIn = (await listMovesTo(date)).filter((jobId) => jobId.startsWith("cust:"));
  const movedInCustomerIds = movedIn.map((jobId) => jobId.slice("cust:".length));
  const movedInCustomers = new Map<string, Customer>(
    customers
      .filter((c) => movedInCustomerIds.includes(c.id))
      .map((c) => [`cust:${c.id}`, c]),
  );

  // Determine which due jobs are moved away
  const movedAway = new Set<string>();
  for (const c of customers) {
    const jobId = `cust:${c.id}`;
    const mv = await getMove(jobId);
    if (mv && mv.toDate !== date) movedAway.add(jobId);
  }

  const { jobs, finalOrder } = assembleDayJobs({ date, customers, day });

  // Filter out removed + moved away
  let filtered = jobs.filter((j) => !removedIds.has(j.jobId) && !movedAway.has(j.jobId));

  // Add moved-in customers even if not due today
  for (const jobId of movedIn) {
    if (removedIds.has(jobId)) continue;
    if (filtered.some((j) => j.jobId === jobId)) continue;
    const c = movedInCustomers.get(jobId);
    if (!c) continue;
    filtered.push({
      jobId: jobId as `cust:${string}`,
      kind: "scheduled",
      customer: c,
      pricePence: c.defaultPricePence,
      cleaned: false,
      collected: false,
      visitNote: "",
    });
  }

  // Reorder with same order list (append anything newly added)
  const idSet = new Set<string>(filtered.map((j) => j.jobId));
  const ordered = finalOrder.filter((id) => idSet.has(id as string));
  const missing = filtered
    .map((j) => j.jobId)
    .filter((id) => !ordered.includes(id as never));
  const finalIds = [...ordered, ...missing] as string[];
  const byId = new Map<string, (typeof filtered)[number]>(filtered.map((j) => [j.jobId, j]));
  filtered = finalIds.map((id) => byId.get(id)!).filter(Boolean);

  return { customers, day, jobs: filtered, finalOrder: finalIds };
}

