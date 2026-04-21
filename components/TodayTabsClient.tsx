"use client";

import { useMemo, useState } from "react";
import { DayJobsClient, type DayJobVM } from "@/components/DayJobsClient";
import { OverdueClient, type OverdueVM } from "@/components/OverdueClient";

type Tab = "today" | "overdue";

export function TodayTabsClient({
  date,
  jobs,
  order,
  overdue,
}: {
  date: string;
  jobs: DayJobVM[];
  order: string[];
  overdue: OverdueVM[];
}) {
  const [tab, setTab] = useState<Tab>(overdue.length ? "overdue" : "today");

  const counts = useMemo(() => {
    const cleaned = jobs.filter((j) => j.cleaned).length;
    const collected = jobs.filter((j) => j.collected).length;
    return { cleaned, collected };
  }, [jobs]);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {date} · {jobs.length} jobs · {counts.cleaned} cleaned · {counts.collected} collected
        </p>

        <div className="mt-3 grid grid-cols-2 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setTab("today")}
            className={[
              "h-10 rounded-lg text-sm font-semibold",
              tab === "today"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                : "text-zinc-600 dark:text-zinc-300",
            ].join(" ")}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setTab("overdue")}
            className={[
              "h-10 rounded-lg text-sm font-semibold",
              tab === "overdue"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                : "text-zinc-600 dark:text-zinc-300",
            ].join(" ")}
          >
            Overdue{overdue.length ? ` (${overdue.length})` : ""}
          </button>
        </div>
      </div>

      {tab === "overdue" ? (
        overdue.length ? (
          <OverdueClient items={overdue} />
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              No overdue collections.
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Anything cleaned on a previous day but not collected will appear here.
            </p>
          </div>
        )
      ) : (
        <DayJobsClient date={date} initialJobs={jobs} initialOrder={order} />
      )}
    </div>
  );
}

