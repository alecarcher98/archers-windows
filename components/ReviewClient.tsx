"use client";

import { useEffect, useState } from "react";

type RemovedRecord = {
  jobId: string;
  dueDate: string;
  removedAt: number;
  note?: string;
};

type Customer = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  street?: string;
  defaultPricePence: number;
};

function formatMoney(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

async function fetchRemoved() {
  const res = await fetch("/api/removed");
  if (!res.ok) throw new Error("failed");
  return (await res.json()) as { ok: true; removed: RemovedRecord[] };
}

async function fetchCustomers() {
  const res = await fetch("/api/customers");
  if (!res.ok) throw new Error("failed");
  return (await res.json()) as { ok: true; customers: Customer[] };
}

async function restore(jobId: string) {
  const res = await fetch("/api/removed", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId }),
  });
  if (!res.ok) throw new Error("failed");
}

async function move(jobId: string, fromDate: string, toDate: string) {
  const res = await fetch("/api/move", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId, fromDate, toDate }),
  });
  if (!res.ok) throw new Error("failed");
}

export function ReviewClient() {
  const [removed, setRemoved] = useState<RemovedRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateByJobId, setDateByJobId] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const [r, c] = await Promise.all([fetchRemoved(), fetchCustomers()]);
        setRemoved(r.removed.sort((a, b) => b.removedAt - a.removedAt));
        setCustomers(c.customers);
        setError(null);
      } catch {
        setError("Could not load review list.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const byCustomerJobId = new Map<string, Customer>(
    customers.map((c) => [`cust:${c.id}`, c]),
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-900/50 dark:bg-red-950/40">
        <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (removed.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Nothing to review.
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          When you remove a house from the week, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {removed.map((r) => {
        const c = byCustomerJobId.get(r.jobId);
        return (
          <div
            key={r.jobId}
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {c ? c.name : r.jobId}
                </p>
                {c ? (
                  <>
                    <p className="mt-0.5 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {c.address}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {formatMoney(c.defaultPricePence)}
                      {c.street ? (
                        <span className="ml-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                          {c.street}
                        </span>
                      ) : null}
                    </p>
                  </>
                ) : (
                  <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                    (Details unavailable — likely a moved/old item.)
                  </p>
                )}
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Removed from week (due {r.dueDate})
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setPending(r.jobId);
                  try {
                    await restore(r.jobId);
                    setRemoved((prev) => prev.filter((x) => x.jobId !== r.jobId));
                  } catch {
                    setError("Could not restore.");
                  } finally {
                    setPending(null);
                  }
                }}
                className="h-10 shrink-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
                disabled={pending !== null}
              >
                Restore
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                type="date"
                value={dateByJobId[r.jobId] ?? r.dueDate}
                onChange={(e) =>
                  setDateByJobId((m) => ({ ...m, [r.jobId]: e.target.value }))
                }
                className="h-10 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
              />
              <button
                type="button"
                onClick={async () => {
                  const toDate = dateByJobId[r.jobId] ?? r.dueDate;
                  if (!toDate) return;
                  setPending(r.jobId);
                  try {
                    await move(r.jobId, r.dueDate, toDate);
                    await restore(r.jobId);
                    setRemoved((prev) => prev.filter((x) => x.jobId !== r.jobId));
                  } catch {
                    setError("Could not reschedule.");
                  } finally {
                    setPending(null);
                  }
                }}
                className="h-10 rounded-xl bg-zinc-900 px-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                disabled={pending !== null}
              >
                Reschedule
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

