import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ScheduleTabsClient } from "@/components/ScheduleTabsClient";
import { listedJobToVm } from "@/lib/dayJobVm";
import { listOverdueForToday } from "@/lib/overdue";
import { buildDayView } from "@/lib/dayView";
import { addDays, isoToday } from "@/lib/schedule";
import { getAppSettings } from "@/lib/settings";
import type { IsoDate } from "@/lib/models";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const date = isoToday();
  const settings = await getAppSettings();
  const { jobs, finalOrder } = await buildDayView(date);
  const overdue = await listOverdueForToday(date);

  const start = isoToday();
  const weekDays = await Promise.all(
    Array.from({ length: 7 }).map(async (_, i) => {
      const d = addDays(start, i);
      const { jobs: dayJobs } = await buildDayView(d);
      return { date: d as IsoDate, count: dayJobs.length };
    }),
  );

  const vms = jobs.map(listedJobToVm);

  return (
    <>
      <AppHeader title="Schedule" />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <Suspense fallback={<p className="text-sm text-zinc-600">Loading…</p>}>
          <ScheduleTabsClient
            date={date}
            jobs={vms}
            order={finalOrder}
            overdue={overdue.map((o) => ({
              jobId: o.jobId,
              sourceDate: o.sourceDate,
              title: o.title,
              subtitle: o.subtitle,
              pricePence: o.pricePence,
            }))}
            weekDays={weekDays}
            settings={settings}
          />
        </Suspense>
      </main>
    </>
  );
}
