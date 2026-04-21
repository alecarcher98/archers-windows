import { AppHeader } from "@/components/AppHeader";
import { buildDayView } from "@/lib/dayView";
import { addDays, isoToday } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export default async function TomorrowPage() {
  const date = addDays(isoToday(), 1);
  const { jobs } = await buildDayView(date);

  return (
    <>
      <AppHeader title="Tomorrow" />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Due tomorrow ({jobs.length})
            </p>
            <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
              {date}
            </p>
          </div>
          {jobs.length === 0 ? (
            <div className="px-4 py-6">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No jobs due tomorrow.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {jobs.map((j) => (
                <li key={j.jobId} className="px-4 py-4">
                  <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {j.kind === "scheduled" ? j.customer.name : j.oneOff.name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {j.kind === "scheduled"
                      ? j.customer.address
                      : j.oneOff.address}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

