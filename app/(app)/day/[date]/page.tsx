import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { DayJobsClient } from "@/components/DayJobsClient";
import { DaySummaryBar } from "@/components/DaySummaryBar";
import { TextChecklist } from "@/components/TextChecklist";
import { listedJobToVm } from "@/lib/dayJobVm";
import { buildDayView } from "@/lib/dayView";
import { isIsoDate } from "@/lib/models";
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
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Invalid date.</p>
          </div>
        </main>
      </>
    );
  }

  const settings = await getAppSettings();
  const { jobs, finalOrder } = await buildDayView(date);
  const vms = jobs.map(listedJobToVm);

  return (
    <>
      <AppHeader
        title={formatDisplayDate(date)}
        right={
          <Link
            href="/schedule?tab=week"
            className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Week
          </Link>
        }
      />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <div className="flex flex-col gap-3">
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
