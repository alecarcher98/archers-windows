"use client";

import { useState } from "react";

export type OverdueVM = {
  jobId: string;
  sourceDate: string;
  title: string;
  subtitle: string;
  pricePence: number;
};

function formatMoneyPounds(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

export function OverdueClient({ items }: { items: OverdueVM[] }) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function markCollected(it: OverdueVM) {
    setError(null);
    setPending(it.jobId);
    try {
      const res = await fetch("/api/overdue/collect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sourceDate: it.sourceDate, jobId: it.jobId }),
      });
      if (!res.ok) throw new Error("failed");
      window.location.reload();
    } catch {
      setError("Couldn’t mark collected. Try again.");
      setPending(null);
    }
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/30">
      <div className="border-b border-amber-200 px-4 py-3 dark:border-amber-900/50">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
          Overdue ({items.length})
        </p>
        <p className="mt-0.5 text-xs text-amber-800/80 dark:text-amber-200/80">
          Cleaned on a previous day, not collected yet.
        </p>
      </div>

      {error ? (
        <p className="px-4 pt-3 text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
      ) : null}

      <ul className="divide-y divide-amber-200 dark:divide-amber-900/50">
        {items.map((it) => (
          <li key={`${it.sourceDate}:${it.jobId}`} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-amber-950 dark:text-amber-50">
                  {it.title}
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm text-amber-900/80 dark:text-amber-200/80">
                  {it.subtitle}
                </p>
                <p className="mt-1 text-xs font-semibold text-amber-900/80 dark:text-amber-200/80">
                  Cleaned: {it.sourceDate}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-amber-950 dark:text-amber-50">
                  {formatMoneyPounds(it.pricePence)}
                </p>
                <button
                  type="button"
                  onClick={() => void markCollected(it)}
                  disabled={pending !== null}
                  className="mt-2 inline-flex h-10 items-center justify-center rounded-xl bg-amber-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 disabled:opacity-40 dark:bg-amber-500 dark:hover:bg-amber-400"
                >
                  {pending === it.jobId ? "Saving…" : "Mark collected"}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

