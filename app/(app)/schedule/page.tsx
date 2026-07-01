import { AppHeader } from "@/components/AppHeader";
import { ScheduleTabsClient, type ScheduleTab } from "@/components/ScheduleTabsClient";
import { listedJobToVm } from "@/lib/dayJobVm";
import { listOverdueForToday } from "@/lib/overdue";
import { buildDayView } from "@/lib/dayView";
import { addDays, isoToday } from "@/lib/schedule";
import { getAppSettings } from "@/lib/settings";
import type { IsoDate } from "@/lib/models";

export const dynamic = "force-dynamic";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const initialTab: ScheduleTab =
    tabParam === "week" || tabParam === "more" ? tabParam : "day";

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
          initialTab={initialTab}
        />
      </main>
    </>
  );
}
