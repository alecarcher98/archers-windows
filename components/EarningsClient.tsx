"use client";

import { useState } from "react";

function formatMoneyPounds(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

type ApiOk = {
  ok: true;
  totalPence: number;
  cashPence: number;
  bankPence: number;
  cardPence: number;
  expectedPence: number;
  scheduledPence: number;
  oneOffPence: number;
  days: Array<{
    date: string;
    expectedPence: number;
    collectedPence: number;
    cashPence: number;
    bankPence: number;
    cardPence: number;
  }>;
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
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-zinc-900">Custom range</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-sm font-medium">Start</span>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="h-12 w-full min-w-0 rounded-xl border border-zinc-200 px-3 text-base"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-medium">End</span>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="h-12 w-full min-w-0 rounded-xl border border-zinc-200 px-3 text-base"
          />
        </label>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void run()}
          disabled={pending || !start || !end}
          className="h-12 rounded-full bg-zinc-900 text-sm font-semibold text-white disabled:opacity-40"
        >
          {pending ? "…" : "Calculate"}
        </button>
        <a
          href={start && end ? `/api/earnings?start=${start}&end=${end}&format=csv` : "#"}
          className={[
            "flex h-12 items-center justify-center rounded-full border border-zinc-200 text-sm font-semibold",
            start && end ? "" : "pointer-events-none opacity-40",
          ].join(" ")}
        >
          Download CSV
        </a>
      </div>

      {error ? <p className="mt-2 text-sm font-medium text-red-600">{error}</p> : null}

      {result ? (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-sm font-semibold">
            Collected: {formatMoneyPounds(result.totalPence)}
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Expected {formatMoneyPounds(result.expectedPence)} · Cash {formatMoneyPounds(result.cashPence)}{" "}
            · Bank {formatMoneyPounds(result.bankPence)}
          </p>
          <p className="text-sm text-zinc-600">
            Round {formatMoneyPounds(result.scheduledPence)} · One-offs{" "}
            {formatMoneyPounds(result.oneOffPence)}
          </p>
        </div>
      ) : null}
    </div>
  );
}
