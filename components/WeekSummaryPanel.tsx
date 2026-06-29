"use client";

import { useEffect, useState } from "react";
import { formatDisplayDateRange } from "@/lib/formatDate";

function gbp(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

type Summary = {
  start: string;
  end: string;
  jobsDone: number;
  jobsTotal: number;
  textsPending: number;
  skipped: number;
  earnings: {
    expectedPence: number;
    totalPence: number;
    cashPence: number;
    bankPence: number;
    cardPence: number;
    scheduledPence: number;
    oneOffPence: number;
  };
};

export function WeekSummaryPanel({ anchorDate }: { anchorDate: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/week-summary?date=${anchorDate}`)
      .then((r) => r.json())
      .then((j: { ok?: boolean; summary?: Summary; error?: string }) => {
        if (j.ok && j.summary) setSummary(j.summary);
        else setError(j.error ?? "Could not load summary");
      })
      .catch(() => setError("Could not load summary"));
  }, [anchorDate]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }
  if (!summary) {
    return <p className="text-sm text-zinc-600">Loading week summary…</p>;
  }

  const e = summary.earnings;
  const gap = e.expectedPence - e.totalPence;

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-zinc-900">Week summary</p>
      <p className="mt-0.5 text-xs text-zinc-600">
        {formatDisplayDateRange(summary.start, summary.end)}
      </p>
      <ul className="mt-3 space-y-2 text-sm">
        <li className="flex justify-between">
          <span className="text-zinc-600">Jobs done</span>
          <span className="font-semibold">
            {summary.jobsDone}/{summary.jobsTotal}
          </span>
        </li>
        <li className="flex justify-between">
          <span className="text-zinc-600">Texts still to send</span>
          <span className="font-semibold">{summary.textsPending}</span>
        </li>
        <li className="flex justify-between">
          <span className="text-zinc-600">Not home (skipped)</span>
          <span className="font-semibold">{summary.skipped}</span>
        </li>
        <li className="flex justify-between border-t border-zinc-200 pt-2">
          <span className="text-zinc-600">Expected</span>
          <span className="font-semibold">{gbp(e.expectedPence)}</span>
        </li>
        <li className="flex justify-between">
          <span className="text-zinc-600">Collected</span>
          <span className="font-semibold">{gbp(e.totalPence)}</span>
        </li>
        {gap > 0 ? (
          <li className="flex justify-between text-amber-700">
            <span>Outstanding</span>
            <span className="font-semibold">{gbp(gap)}</span>
          </li>
        ) : null}
        <li className="flex justify-between text-zinc-600">
          <span>Cash</span>
          <span>{gbp(e.cashPence)}</span>
        </li>
        <li className="flex justify-between text-zinc-600">
          <span>Bank</span>
          <span>{gbp(e.bankPence)}</span>
        </li>
        <li className="flex justify-between text-zinc-600">
          <span>Card</span>
          <span>{gbp(e.cardPence)}</span>
        </li>
        <li className="flex justify-between text-zinc-600">
          <span>Round / one-off</span>
          <span>
            {gbp(e.scheduledPence)} / {gbp(e.oneOffPence)}
          </span>
        </li>
      </ul>
    </section>
  );
}
