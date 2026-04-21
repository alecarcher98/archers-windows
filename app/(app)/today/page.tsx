import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import type { DayJobVM } from "@/components/DayJobsClient";
import { TodayTabsClient } from "@/components/TodayTabsClient";
import { listOverdueForToday } from "@/lib/overdue";
import { buildDayView } from "@/lib/dayView";
import { isoToday } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const date = isoToday();
  const { jobs, finalOrder } = await buildDayView(date);
  const overdue = await listOverdueForToday(date);

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
        title="Today"
        right={
          <Link
            href="/today/print"
            className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Print
          </Link>
        }
      />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <TodayTabsClient
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
        />
      </main>
    </>
  );
}

