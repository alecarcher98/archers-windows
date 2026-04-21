import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { DayJobsClient, type DayJobVM } from "@/components/DayJobsClient";
import { buildDayView } from "@/lib/dayView";
import { isIsoDate } from "@/lib/models";

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
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Invalid date.
            </p>
          </div>
        </main>
      </>
    );
  }

  const { jobs, finalOrder } = await buildDayView(date);

  const vms: DayJobVM[] = jobs.map((j) => ({
    jobId: j.jobId,
    kind: j.kind,
    title: j.kind === "scheduled" ? j.customer.name : j.oneOff.name,
    subtitle: j.kind === "scheduled" ? j.customer.address : j.oneOff.address,
    street: j.kind === "scheduled" ? j.customer.street : undefined,
    phone: j.kind === "scheduled" ? j.customer.phone : j.oneOff.phone,
    pricePence: j.pricePence,
    cleaned: j.cleaned,
    collected: j.collected,
    visitNote: j.visitNote,
    deletable: j.kind === "oneoff",
  }));

  return (
    <>
      <AppHeader
        title={date}
        right={
          <Link
            href="/week"
            className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Week
          </Link>
        }
      />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {vms.length} jobs
          </p>
        </div>
        <DayJobsClient date={date} initialJobs={vms} initialOrder={finalOrder} />
      </main>
    </>
  );
}

