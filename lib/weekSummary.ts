import { buildDayView } from "@/lib/dayView";
import type { IsoDate } from "@/lib/models";
import { sumEarnings, weekRangeFor } from "@/lib/earnings";
import { addDays } from "@/lib/schedule";

export async function buildWeekSummary(anchor: IsoDate) {
  const { start, end } = weekRangeFor(anchor);
  const earnings = await sumEarnings(start, end);

  let jobsDone = 0;
  let jobsTotal = 0;
  let textsPending = 0;
  let skipped = 0;

  for (let i = 0; i < 7; i++) {
    const date = addDays(start, i);
    const { jobs } = await buildDayView(date);
    for (const j of jobs) {
      jobsTotal += 1;
      if (j.skipped) {
        skipped += 1;
        continue;
      }
      if (j.cleaned && j.collected) {
        jobsDone += 1;
        if (!j.smsSentAt) textsPending += 1;
      }
    }
  }

  return {
    start,
    end,
    earnings,
    jobsDone,
    jobsTotal,
    textsPending,
    skipped,
  };
}
