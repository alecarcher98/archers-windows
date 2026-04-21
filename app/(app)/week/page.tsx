import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { buildDayView } from "@/lib/dayView";
import { addDays, isoToday } from "@/lib/schedule";
import type { IsoDate } from "@/lib/models";

export const dynamic = "force-dynamic";

function isoLabel(d: IsoDate) {
  return d;
}

export default async function WeekPage() {
  const start = isoToday();

  const days = await Promise.all(
    Array.from({ length: 7 }).map(async (_, i) => {
      const date = addDays(start, i);
      const { jobs } = await buildDayView(date);
      return { date, count: jobs.length };
    }),
  );

  return (
    <>
      <AppHeader
        title="Week"
        right={
          <Link
            href="/review"
            className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Review
          </Link>
        }
      />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Next 7 days
            </p>
          </div>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {days.map((d) => (
              <li key={d.date}>
                <Link
                  href={`/day/${d.date}`}
                  className="flex items-center justify-between px-4 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {isoLabel(d.date)}
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {d.count} jobs
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}

