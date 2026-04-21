"use client";

import { useState } from "react";

function formatMoneyPounds(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

type ApiOk = {
  ok: true;
  totalPence: number;
  days: Array<{ date: string; totalPence: number }>;
};

export function EarningsClient() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiOk | null>(null);

  async function run() {
    setError(null);
    setResult(null);
    setPending(true);
    try {
      const res = await fetch(`/api/earnings?start=${start}&end=${end}`);
      const json = (await res.json()) as ApiOk | { ok: false; error: string };
      if (!res.ok || !("ok" in json) || json.ok !== true) {
        setError("error" in json ? json.error : "Could not load earnings.");
        return;
      }
      setResult(json);
    } catch {
      setError("Could not load earnings.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Custom range</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Start</span>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">End</span>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => void run()}
        disabled={pending || !start || !end}
        className="mt-3 h-12 w-full rounded-xl bg-zinc-900 text-base font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {pending ? "Calculating…" : "Calculate"}
      </button>

      {error ? (
        <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-500">{error}</p>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Total: {formatMoneyPounds(result.totalPence)}
          </p>
          {result.days.length ? (
            <ul className="mt-2 space-y-1">
              {result.days.map((d) => (
                <li key={d.date} className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                  <span>{d.date}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {formatMoneyPounds(d.totalPence)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">No cash collected in this range.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

