"use client";

import { useMemo } from "react";
import type { DayJobVM } from "@/lib/dayJobVm";
import { dayRouteHref } from "@/lib/phoneUtils";

function formatMoney(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

export function DaySummaryBar({ jobs, date }: { jobs: DayJobVM[]; date: string }) {
  const stats = useMemo(() => {
    const active = jobs.filter((j) => !j.skipped);
    const expected = active.reduce((s, j) => s + j.pricePence, 0);
    const collected = active.filter((j) => j.collected).reduce((s, j) => s + j.pricePence, 0);
    const done = active.filter((j) => j.cleaned && j.collected).length;
    const addresses = active.filter((j) => !(j.cleaned && j.collected)).map((j) => j.subtitle);
    return { expected, collected, done, total: active.length, addresses };
  }, [jobs]);

  const gap = stats.expected - stats.collected;

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Today</p>
          <p className="text-lg font-bold text-zinc-900">
            {stats.done}/{stats.total} done
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="text-zinc-600">Expected {formatMoney(stats.expected)}</p>
          <p className="font-semibold text-zinc-900">Collected {formatMoney(stats.collected)}</p>
          {gap > 0 ? <p className="text-amber-700">{formatMoney(gap)} outstanding</p> : null}
        </div>
      </div>
      {stats.addresses.length ? (
        <a
          href={dayRouteHref(stats.addresses)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex h-10 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
        >
          Open route in Maps ({stats.addresses.length} stops)
        </a>
      ) : null}
    </div>
  );
}
