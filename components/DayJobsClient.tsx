"use client";

import { useMemo, useState } from "react";

export type DayJobVM = {
  jobId: string;
  kind: "scheduled" | "oneoff";
  title: string;
  subtitle: string;
  street?: string;
  phone?: string;
  pricePence: number;
  cleaned: boolean;
  collected: boolean;
  visitNote: string;
  deletable?: boolean;
};

function formatMoneyPounds(pence: number) {
  const pounds = (pence / 100).toFixed(2);
  return `£${pounds}`;
}

async function patchDay(date: string, body: unknown) {
  const res = await fetch(`/api/day/${date}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed");
  return (await res.json()) as { ok: true };
}

async function moveJob(body: { jobId: string; fromDate: string; toDate: string }) {
  const res = await fetch("/api/move", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed");
}

async function removeFromWeek(body: { jobId: string; dueDate: string }) {
  const res = await fetch("/api/removed", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed");
}

export function DayJobsClient({
  date,
  initialJobs,
  initialOrder,
}: {
  date: string;
  initialJobs: DayJobVM[];
  initialOrder: string[];
}) {
  const [jobs, setJobs] = useState<DayJobVM[]>(initialJobs);
  const [order, setOrder] = useState<string[]>(initialOrder);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRemainingOnly, setShowRemainingOnly] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [openMore, setOpenMore] = useState<Record<string, boolean>>({});

  const jobsById = useMemo(() => new Map(jobs.map((j) => [j.jobId, j])), [jobs]);

  const orderedJobs = useMemo(() => {
    const known = order.filter((id) => jobsById.has(id));
    const missing = jobs.filter((j) => !known.includes(j.jobId)).map((j) => j.jobId);
    const all = [...known, ...missing].map((id) => jobsById.get(id)!).filter(Boolean);
    if (!showRemainingOnly) return all;
    return all.filter((j) => !(j.cleaned && j.collected));
  }, [jobsById, jobs, order, showRemainingOnly]);

  async function persistOrder(next: string[]) {
    setSaving("order");
    setError(null);
    setOrder(next);
    try {
      await patchDay(date, { orderedJobIds: next });
    } catch {
      setError("Couldn’t save order. Try again.");
    } finally {
      setSaving(null);
    }
  }

  async function persistState(jobId: string, patch: Partial<DayJobVM>) {
    setSaving(jobId);
    setError(null);
    setJobs((prev) => prev.map((j) => (j.jobId === jobId ? { ...j, ...patch } : j)));
    try {
      const statePatch: Record<string, unknown> = {};
      statePatch[jobId] = {
        cleaned: patch.cleaned,
        collected: patch.collected,
        visitNote: patch.visitNote,
      };
      await patchDay(date, { jobState: statePatch });
    } catch {
      setError("Couldn’t save. Try again.");
    } finally {
      setSaving(null);
    }
  }

  async function addOneOff(input: {
    name: string;
    address: string;
    phone: string;
    pricePence: number;
  }) {
    setSaving("oneoff");
    setError(null);
    try {
      await patchDay(date, { addOneOff: input });
      // Reload the page state cheaply by forcing a refresh.
      // (Server-render will rebuild from KV; keeps client code small.)
      window.location.reload();
    } catch {
      setError("Couldn’t add one-off. Try again.");
    } finally {
      setSaving(null);
    }
  }

  async function deleteOneOff(jobId: string) {
    if (!jobId.startsWith("oneoff:")) return;
    setSaving(jobId);
    setError(null);
    try {
      await patchDay(date, { deleteOneOffId: jobId });
      window.location.reload();
    } catch {
      setError("Couldn’t delete. Try again.");
    } finally {
      setSaving(null);
    }
  }

  const [dragId, setDragId] = useState<string | null>(null);
  const [moveOpenFor, setMoveOpenFor] = useState<string | null>(null);
  const [moveToDate, setMoveToDate] = useState<string>("");

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <AddOneOffCard disabled={saving !== null} onAdd={addOneOff} />

      <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Jobs
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRemainingOnly((v) => !v)}
              className={[
                "h-10 rounded-xl px-3 text-sm font-semibold shadow-sm",
                showRemainingOnly
                  ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  : "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900",
              ].join(" ")}
            >
              {showRemainingOnly ? "Showing remaining" : "Show remaining"}
            </button>
            <button
              type="button"
              onClick={() => setReorderMode((v) => !v)}
              className={[
                "h-10 rounded-xl px-3 text-sm font-semibold shadow-sm",
                reorderMode
                  ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  : "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900",
              ].join(" ")}
            >
              {reorderMode ? "Done" : "Reorder"}
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
          Tap <span className="font-semibold">Cleaned</span> and{" "}
          <span className="font-semibold">Collected</span>. Use “More” for moving, notes, or removing.
        </p>
      </div>

      <ul className="space-y-3">
        {orderedJobs.map((j, idx) => (
          <li
            key={j.jobId}
            draggable={reorderMode}
            onDragStart={() => setDragId(j.jobId)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (!reorderMode) return;
              if (!dragId || dragId === j.jobId) return;
              const next = orderedJobs.map((x) => x.jobId).filter((x) => x !== dragId);
              const targetIndex = next.indexOf(j.jobId);
              next.splice(targetIndex, 0, dragId);
              void persistOrder(next);
              setDragId(null);
            }}
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
                    {j.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {j.subtitle}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatMoneyPounds(j.pricePence)}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void persistState(j.jobId, { cleaned: !j.cleaned })}
                  className={[
                    "h-12 rounded-xl text-base font-semibold shadow-sm",
                    j.cleaned
                      ? "bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                      : "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900",
                  ].join(" ")}
                >
                  Cleaned
                </button>
                <button
                  type="button"
                  onClick={() => void persistState(j.jobId, { collected: !j.collected })}
                  className={[
                    "h-12 rounded-xl text-base font-semibold shadow-sm",
                    j.collected
                      ? "bg-amber-600 text-white hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400"
                      : "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900",
                  ].join(" ")}
                >
                  Collected
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {j.phone ? (
                  <a
                    href={`tel:${j.phone}`}
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
                  >
                    Call
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={() => setOpenMore((m) => ({ ...m, [j.jobId]: !Boolean(m[j.jobId]) }))}
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
                >
                  {openMore[j.jobId] ? "Less" : "More"}
                </button>

                {reorderMode ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (idx === 0) return;
                        const ids = orderedJobs.map((x) => x.jobId);
                        const a = ids[idx - 1];
                        ids[idx - 1] = ids[idx];
                        ids[idx] = a;
                        void persistOrder(ids);
                      }}
                      className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
                      disabled={idx === 0 || saving === "order"}
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (idx === orderedJobs.length - 1) return;
                        const ids = orderedJobs.map((x) => x.jobId);
                        const a = ids[idx + 1];
                        ids[idx + 1] = ids[idx];
                        ids[idx] = a;
                        void persistOrder(ids);
                      }}
                      className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
                      disabled={idx === orderedJobs.length - 1 || saving === "order"}
                    >
                      Down
                    </button>
                  </>
                ) : null}
              </div>

              {openMore[j.jobId] ? (
                <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMoveOpenFor((cur) => (cur === j.jobId ? null : j.jobId));
                        setMoveToDate(date);
                      }}
                      className="h-10 rounded-xl bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
                    >
                      Move
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        setSaving(j.jobId);
                        setError(null);
                        try {
                          await removeFromWeek({ jobId: j.jobId, dueDate: date });
                          window.location.reload();
                        } catch {
                          setError("Couldn’t remove. Try again.");
                          setSaving(null);
                        }
                      }}
                      className="h-10 rounded-xl bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-40 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
                      disabled={saving !== null}
                    >
                      Remove from week
                    </button>

                    {j.deletable ? (
                      <button
                        type="button"
                        onClick={() => void deleteOneOff(j.jobId)}
                        className="h-10 rounded-xl border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 dark:border-red-900/50 dark:bg-zinc-950 dark:text-red-300 dark:hover:bg-red-950/30"
                        disabled={saving !== null}
                      >
                        Delete one-off
                      </button>
                    ) : null}
                  </div>

                  <label className="mt-3 block">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Note
                    </span>
                    <textarea
                      defaultValue={j.visitNote}
                      placeholder="Visit note (e.g. dog was loose)…"
                      onBlur={(e) => {
                        const v = e.currentTarget.value;
                        if (v === j.visitNote) return;
                        void persistState(j.jobId, { visitNote: v });
                      }}
                      className="mt-1 min-h-[44px] w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
                    />
                  </label>
                </div>
              ) : null}

              {moveOpenFor === j.jobId ? (
                <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Move to</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const toDate = new Date(Date.now() - 86_400_000)
                          .toISOString()
                          .slice(0, 10);
                        setSaving(j.jobId);
                        try {
                          await moveJob({ jobId: j.jobId, fromDate: date, toDate });
                          window.location.reload();
                        } catch {
                          setError("Couldn’t move. Try again.");
                          setSaving(null);
                        }
                      }}
                      className="h-10 rounded-xl bg-white text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
                      disabled={saving !== null}
                    >
                      Yesterday
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const toDate = new Date(Date.now() + 86_400_000)
                          .toISOString()
                          .slice(0, 10);
                        setSaving(j.jobId);
                        try {
                          await moveJob({ jobId: j.jobId, fromDate: date, toDate });
                          window.location.reload();
                        } catch {
                          setError("Couldn’t move. Try again.");
                          setSaving(null);
                        }
                      }}
                      className="h-10 rounded-xl bg-white text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
                      disabled={saving !== null}
                    >
                      Tomorrow
                    </button>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="date"
                      value={moveToDate}
                      onChange={(e) => setMoveToDate(e.target.value)}
                      className="h-10 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!moveToDate) return;
                        setSaving(j.jobId);
                        setError(null);
                        const toDate = moveToDate;
                        const targets =
                          j.kind === "scheduled" && j.street
                            ? orderedJobs
                                .filter(
                                  (x) =>
                                    x.kind === "scheduled" &&
                                    x.street &&
                                    x.street === j.street,
                                )
                                .map((x) => x.jobId)
                            : [j.jobId];
                        try {
                          for (const jobId of targets) {
                            await moveJob({ jobId, fromDate: date, toDate });
                          }
                          window.location.reload();
                        } catch {
                          setError("Couldn’t move. Try again.");
                          setSaving(null);
                        }
                      }}
                      className="h-10 rounded-xl bg-zinc-900 px-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                      disabled={saving !== null || !moveToDate}
                    >
                      Move
                    </button>
                  </div>

                  {j.kind === "scheduled" && j.street ? (
                    <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                      This will move everyone on <span className="font-semibold">{j.street}</span>{" "}
                      who is on this day (keeps streets aligned).
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {saving === j.jobId ? (
              <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Saving…
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      {saving === "order" ? (
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Saving order…</p>
      ) : null}
    </div>
  );
}

function AddOneOffCard({
  disabled,
  onAdd,
}: {
  disabled: boolean;
  onAdd: (input: { name: string; address: string; phone: string; pricePence: number }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [price, setPrice] = useState("");

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            One-off job
          </p>
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
            Walk-up customer just for today.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          disabled={disabled}
        >
          {open ? "Close" : "Add"}
        </button>
      </div>

      {open ? (
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Address
            </span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Phone
              </span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Price (£)
              </span>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
                className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => {
              const normalized = price.replaceAll(",", ".").trim();
              const pounds = Number(normalized);
              const pricePence = Math.round(pounds * 100);
              if (!name.trim() || !address.trim() || !Number.isFinite(pricePence)) return;
              onAdd({ name: name.trim(), address: address.trim(), phone: phone.trim(), pricePence });
              setOpen(false);
              setName("");
              setAddress("");
              setPhone("");
              setPrice("");
            }}
            disabled={disabled}
            className="h-12 rounded-xl bg-emerald-600 text-base font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-40 dark:bg-emerald-500 dark:hover:bg-emerald-400"
          >
            Save one-off
          </button>
        </div>
      ) : null}
    </div>
  );
}

