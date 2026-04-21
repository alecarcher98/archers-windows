import Link from "next/link";
import { formatDisplayDate } from "@/lib/formatDate";
import type { IsoDate } from "@/lib/models";

export function ScheduleWeekPanel({
  days,
}: {
  days: { date: IsoDate; count: number }[];
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Next 7 days</p>
        <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">Tap a day to open the run sheet</p>
      </div>
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {days.map((d) => (
          <li key={d.date}>
            <Link
              href={`/day/${d.date}`}
              className="flex items-center justify-between px-4 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {formatDisplayDate(d.date)}
              </span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {d.count} job{d.count === 1 ? "" : "s"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
