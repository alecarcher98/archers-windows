import Link from "next/link";
import { getDay, getCustomersByIds, listCustomerIds } from "@/lib/kv";
import { assembleDayJobs, isoToday } from "@/lib/schedule";

export const dynamic = "force-dynamic";

function formatMoneyPounds(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

export default async function TodayPrintPage() {
  const date = isoToday();
  const ids = await listCustomerIds();
  const customers = await getCustomersByIds(ids);
  const day = await getDay(date);
  const { jobs } = assembleDayJobs({ date, customers, day });

  return (
    <main className="min-h-dvh bg-white text-zinc-900 print:min-h-0">
      <div className="mx-auto max-w-3xl px-4 py-6 print:max-w-none print:px-0 print:py-0">
        <div className="flex items-center justify-between gap-3 print:hidden">
          <Link
            href="/today"
            className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            Back
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
          >
            Print
          </button>
        </div>

        <header className="mt-4 print:mt-0">
          <h1 className="text-2xl font-bold tracking-tight">Day sheet</h1>
          <p className="mt-1 text-sm text-zinc-600">{date}</p>
        </header>

        <section className="mt-6">
          {jobs.length === 0 ? (
            <p className="text-sm text-zinc-600">No jobs due today.</p>
          ) : (
            <ol className="space-y-4">
              {jobs.map((j, idx) => {
                const title = j.kind === "scheduled" ? j.customer.name : j.oneOff.name;
                const address = j.kind === "scheduled" ? j.customer.address : j.oneOff.address;
                const phone = j.kind === "scheduled" ? j.customer.phone : j.oneOff.phone;

                return (
                  <li
                    key={j.jobId}
                    className="rounded-xl border border-zinc-200 p-4 print:break-inside-avoid"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-base font-bold">
                          {idx + 1}. {title}
                        </p>
                        <p className="mt-1 text-sm text-zinc-700">{address}</p>
                        {phone ? (
                          <p className="mt-1 text-sm font-semibold">{phone}</p>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-semibold">
                            {formatMoneyPounds(j.pricePence)}
                          </span>
                          <span className="inline-block h-5 w-5 rounded border border-zinc-400" />
                        </div>
                        <p className="mt-1 text-xs text-zinc-600">Done</p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="h-px bg-zinc-200" />
                      <div className="h-px bg-zinc-200" />
                      <div className="h-px bg-zinc-200" />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}

