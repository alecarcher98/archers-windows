"use client";

import { useMemo, useState } from "react";
import { DayJobsClient } from "@/components/DayJobsClient";
import { DaySummaryBar } from "@/components/DaySummaryBar";
import { OverdueClient, type OverdueVM } from "@/components/OverdueClient";
import { TextChecklist } from "@/components/TextChecklist";
import type { DayJobVM } from "@/lib/dayJobVm";
import type { AppSettings } from "@/lib/models";
import { formatDisplayDate } from "@/lib/formatDate";

type Tab = "today" | "overdue";

export function TodayTabsClient({
  date,
  jobs,
  order,
  overdue,
  settings,
}: {
  date: string;
  jobs: DayJobVM[];
  order: string[];
  overdue: OverdueVM[];
  settings: AppSettings;
}) {
  const [tab, setTab] = useState<Tab>(overdue.length ? "overdue" : "today");

  const stats = useMemo(() => {
    const active = jobs.filter((j) => !j.skipped);
    const done = active.filter((j) => j.cleaned && j.collected).length;
    const collectedPence = active.filter((j) => j.collected).reduce((s, j) => s + j.pricePence, 0);
    return { done, total: active.length, collectedPence };
  }, [jobs]);

  const progressPct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Today · {formatDisplayDate(date)}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
              {stats.done}/{stats.total} done
            </p>
            <p className="mt-0.5 text-sm text-zinc-600">
              £{(stats.collectedPence / 100).toFixed(2)} collected
            </p>
          </div>
          <p className="text-3xl font-bold text-[var(--brand)]/20">{progressPct}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="mt-3 grid grid-cols-2 rounded-xl border border-zinc-200 bg-zinc-50 p-1">
          <button
            type="button"
            onClick={() => setTab("today")}
            className={[
              "h-10 rounded-lg text-sm font-semibold",
              tab === "today" ? "bg-white text-[var(--brand-dark)] shadow-sm" : "text-zinc-600",
            ].join(" ")}
          >
            Jobs
          </button>
          <button
            type="button"
            onClick={() => setTab("overdue")}
            className={[
              "h-10 rounded-lg text-sm font-semibold",
              tab === "overdue" ? "bg-white text-[var(--brand-dark)] shadow-sm" : "text-zinc-600",
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
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-zinc-900">No overdue collections.</p>
            <p className="mt-1 text-sm text-zinc-600">
              Cleaned on a previous day but not collected yet will show here.
            </p>
          </div>
        )
      ) : (
        <>
          <DaySummaryBar jobs={jobs} date={date} />
          <TextChecklist date={date} jobs={jobs} settings={settings} />
          <DayJobsClient
            date={date}
            initialJobs={jobs}
            initialOrder={order}
            compactMode={settings.compactMode}
          />
        </>
      )}
    </div>
  );
}
