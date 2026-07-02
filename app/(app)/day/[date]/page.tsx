import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { DayJobsClient } from "@/components/DayJobsClient";
import { DaySummaryBar } from "@/components/DaySummaryBar";
import { DayStrip } from "@/components/DayStrip";
import { TextChecklist } from "@/components/TextChecklist";
import { listedJobToVm } from "@/lib/dayJobVm";
import { buildDayView } from "@/lib/dayView";
import { addDays } from "@/lib/schedule";
import { isIsoDate } from "@/lib/models";
import type { IsoDate } from "@/lib/models";
import { formatDisplayDate } from "@/lib/formatDate";
import { getAppSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function DayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isIsoDate(date)) {
    return (
      <>
        <AppHeader title="Day" />
        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
          <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-zinc-600">Invalid date.</p>
          </div>
        </main>
      </>
    );
  }

  const settings = await getAppSettings();
  const { jobs, finalOrder } = await buildDayView(date);
  const vms = jobs.map(listedJobToVm);

  const stripStart = addDays(date, -3);
  const weekDays = await Promise.all(
    Array.from({ length: 7 }).map(async (_, i) => {
      const d = addDays(stripStart, i);
      const { jobs: dayJobs } = await buildDayView(d);
      return { date: d as IsoDate, count: dayJobs.length };
    }),
  );

  return (
    <>
      <AppHeader
        title={formatDisplayDate(date)}
        right={
          <Link
            href="/schedule?tab=week"
            className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            Week
          </Link>
        }
      />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <div className="flex flex-col gap-3">
          <DayStrip days={weekDays} activeDate={date} />
          <DaySummaryBar jobs={vms} date={date} />
          <TextChecklist date={date} jobs={vms} settings={settings} />
          <DayJobsClient
            date={date}
            initialJobs={vms}
            initialOrder={finalOrder}
            compactMode={settings.compactMode}
          />
        </div>
      </main>
    </>
  );
}
