"use client";

import Link from "next/link";
import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { SwipeableJobRow } from "@/components/SwipeableJobRow";
import { Toast, useToast } from "@/components/Toast";
import type { DayJobVM } from "@/lib/dayJobVm";
import type { PaymentType } from "@/lib/models";
import { mapsHref } from "@/lib/phoneUtils";
import { addDays } from "@/lib/schedule";

export type { DayJobVM };

function customerEditHref(jobId: string) {
  if (!jobId.startsWith("cust:")) return null;
  return `/customers/${jobId.slice("cust:".length)}`;
}

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
  compactMode = false,
}: {
  date: string;
  initialJobs: DayJobVM[];
  initialOrder: string[];
  compactMode?: boolean;
}) {
  const { toast, showToast } = useToast();
  const [jobs, setJobs] = useState<DayJobVM[]>(initialJobs);
  const [order, setOrder] = useState<string[]>(initialOrder);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRemainingOnly, setShowRemainingOnly] = useState(false);
  const [groupByStreet, setGroupByStreet] = useState(true);
  const [reorderMode, setReorderMode] = useState(false);
  const [openMore, setOpenMore] = useState<Record<string, boolean>>({});
  const [moveOpenFor, setMoveOpenFor] = useState<string | null>(null);
  const [moveToDate, setMoveToDate] = useState<string>("");

  const jobsById = useMemo(() => new Map(jobs.map((j) => [j.jobId, j])), [jobs]);

  const orderedJobs = useMemo(() => {
    const known = order.filter((id) => jobsById.has(id));
    const missing = jobs.filter((j) => !known.includes(j.jobId)).map((j) => j.jobId);
    const all = [...known, ...missing].map((id) => jobsById.get(id)!).filter(Boolean);
    if (!showRemainingOnly) return all;
    return all.filter((j) => !(j.cleaned && j.collected) && !j.skipped);
  }, [jobsById, jobs, order, showRemainingOnly]);

  // Kept in sync via ref rather than closed over directly, so the stable
  // callbacks below (used as JobRow props) never need `orderedJobs` in their
  // dependency array — that would recreate them, and every row, on every
  // edit. Long job lists make that recreate-the-world cost real. Synced in a
  // layout effect (not during render) since writing to a ref's `current` is
  // only safe outside of render.
  const orderedJobsRef = useRef(orderedJobs);
  const jobsRef = useRef(jobs);
  useLayoutEffect(() => {
    orderedJobsRef.current = orderedJobs;
    jobsRef.current = jobs;
  });

  const streetGroups = useMemo(() => {
    if (!groupByStreet || reorderMode) {
      return [{ key: "", label: "", jobs: orderedJobs }];
    }
    const map = new Map<string, DayJobVM[]>();
    for (const j of orderedJobs) {
      const key = j.street?.trim() || "Other";
      const list = map.get(key) ?? [];
      list.push(j);
      map.set(key, list);
    }
    return Array.from(map.entries()).map(([key, list]) => ({
      key,
      label: key,
      jobs: list,
    }));
  }, [groupByStreet, orderedJobs, reorderMode]);

  const persistOrder = useCallback(
    async (next: string[]) => {
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
    },
    [date],
  );

  const persistState = useCallback(
    async (jobId: string, patch: Partial<DayJobVM>, quiet = false) => {
      const current = jobsRef.current.find((j) => j.jobId === jobId);
      if (!current) return;
      const nextSnapshot: DayJobVM = { ...current, ...patch };
      if (patch.collected === true && !patch.paymentType && !current.paymentType) {
        nextSnapshot.paymentType = "cash";
      }
      setSaving(jobId);
      setError(null);
      // Optimistic: the row reflects the new state immediately. The network
      // call below confirms it in the background — a flaky connection out in
      // the field shouldn't lock the screen waiting on a round trip.
      setJobs((prev) => prev.map((j) => (j.jobId === jobId ? nextSnapshot : j)));
      try {
        await patchDay(date, {
          jobState: {
            [jobId]: {
              cleaned: nextSnapshot.cleaned,
              collected: nextSnapshot.collected,
              visitNote: nextSnapshot.visitNote,
              paymentType: nextSnapshot.paymentType,
              skipped: nextSnapshot.skipped,
              smsSentAt: nextSnapshot.smsSentAt,
            },
          },
        });
        if (!quiet) showToast("Saved");
      } catch {
        setError("Couldn’t save. Try again.");
      } finally {
        setSaving(null);
      }
    },
    [date, showToast],
  );

  const markStreetDone = useCallback(
    async (street: string) => {
      const targets = orderedJobsRef.current.filter(
        (j) => (j.street?.trim() || "Other") === street && !j.skipped,
      );
      for (const j of targets) {
        await persistState(
          j.jobId,
          { cleaned: true, collected: true, paymentType: j.paymentType ?? "cash" },
          true,
        );
      }
      showToast(`Marked ${street} done`);
    },
    [persistState, showToast],
  );

  const notHome = useCallback(
    async (job: DayJobVM) => {
      const tomorrow = addDays(date as never, 1);
      setSaving(job.jobId);
      try {
        await moveJob({ jobId: job.jobId, fromDate: date, toDate: tomorrow });
        showToast("Moved to tomorrow");
        window.location.reload();
      } catch {
        setError("Couldn’t move. Try again.");
        setSaving(null);
      }
    },
    [date, showToast],
  );

  const addOneOff = useCallback(
    async (input: { name: string; address: string; phone: string; pricePence: number }) => {
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
    },
    [date],
  );

  const deleteOneOff = useCallback(
    async (jobId: string) => {
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
    },
    [date],
  );

  const removeJobFromWeek = useCallback(
    async (job: DayJobVM) => {
      setSaving(job.jobId);
      setError(null);
      try {
        await removeFromWeek({ jobId: job.jobId, dueDate: date });
        window.location.reload();
      } catch {
        setError("Couldn’t remove. Try again.");
        setSaving(null);
      }
    },
    [date],
  );

  const moveJobTo = useCallback(
    async (job: DayJobVM, toDate: string) => {
      setSaving(job.jobId);
      setError(null);
      const targets =
        job.kind === "scheduled" && job.street
          ? orderedJobsRef.current
              .filter((x) => x.kind === "scheduled" && x.street && x.street === job.street)
              .map((x) => x.jobId)
          : [job.jobId];
      try {
        for (const jobId of targets) {
          await moveJob({ jobId, fromDate: date, toDate });
        }
        window.location.reload();
      } catch {
        setError("Couldn’t move. Try again.");
        setSaving(null);
      }
    },
    [date],
  );

  const toggleMore = useCallback((jobId: string) => {
    setOpenMore((m) => ({ ...m, [jobId]: !Boolean(m[jobId]) }));
  }, []);

  const openMove = useCallback(
    (jobId: string) => {
      setMoveOpenFor((cur) => (cur === jobId ? null : jobId));
      setMoveToDate(date);
    },
    [date],
  );

  const moveUp = useCallback(
    (idx: number) => {
      if (idx <= 0) return;
      const ids = orderedJobsRef.current.map((x) => x.jobId);
      const a = ids[idx - 1];
      ids[idx - 1] = ids[idx];
      ids[idx] = a;
      void persistOrder(ids);
    },
    [persistOrder],
  );

  const moveDown = useCallback(
    (idx: number) => {
      const ids = orderedJobsRef.current.map((x) => x.jobId);
      if (idx >= ids.length - 1) return;
      const a = ids[idx + 1];
      ids[idx + 1] = ids[idx];
      ids[idx] = a;
      void persistOrder(ids);
    },
    [persistOrder],
  );

  const dragIdRef = useRef<string | null>(null);

  const handleDragStart = useCallback((jobId: string) => {
    dragIdRef.current = jobId;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (jobId: string) => {
      const dragId = dragIdRef.current;
      if (!dragId || dragId === jobId) return;
      const next = orderedJobsRef.current.map((x) => x.jobId).filter((x) => x !== dragId);
      const targetIndex = next.indexOf(jobId);
      next.splice(targetIndex, 0, dragId);
      void persistOrder(next);
      dragIdRef.current = null;
    },
    [persistOrder],
  );

  return (
    <div className="flex flex-col gap-3">
      <Toast message={toast} />
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <AddOneOffCard disabled={saving !== null} onAdd={addOneOff} />

      <div className="rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-900">Jobs</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRemainingOnly((v) => !v)}
              className={[
                "min-h-10 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold shadow-sm",
                showRemainingOnly
                  ? "bg-zinc-900 text-white hover:bg-zinc-800"
                  : "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
              ].join(" ")}
            >
              {showRemainingOnly ? "Showing remaining" : "Show remaining"}
            </button>
            <button
              type="button"
              onClick={() => setGroupByStreet((v) => !v)}
              className={[
                "min-h-10 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold shadow-sm",
                groupByStreet
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 bg-white text-zinc-900",
              ].join(" ")}
            >
              {groupByStreet ? "By street" : "Flat list"}
            </button>
            <button
              type="button"
              onClick={() => setReorderMode((v) => !v)}
              className={[
                "min-h-10 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold shadow-sm",
                reorderMode
                  ? "bg-zinc-900 text-white hover:bg-zinc-800"
                  : "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
              ].join(" ")}
            >
              {reorderMode ? "Done" : "Reorder"}
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-zinc-600">
          Tap <span className="font-semibold">Done</span> when finished, or use Cleaned / Collected
          separately. Swipe a job right for Paid, left to skip. “More” for notes and moving.
        </p>
      </div>

      <div className="space-y-4">
        {streetGroups.map((group) => (
          <div key={group.key || "all"}>
            {group.label && groupByStreet && !reorderMode ? (
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-zinc-800">{group.label}</p>
                <button
                  type="button"
                  onClick={() => void markStreetDone(group.label)}
                  className="h-9 rounded-full bg-zinc-900 px-3 text-xs font-semibold text-white"
                >
                  Mark street done
                </button>
              </div>
            ) : null}
            <ul className="space-y-3">
              {group.jobs.map((j, idx) => (
                <JobRow
                  key={j.jobId}
                  job={j}
                  idx={idx}
                  isLast={idx === orderedJobs.length - 1}
                  compactMode={compactMode}
                  reorderMode={reorderMode}
                  isSaving={saving === j.jobId}
                  isOrderSaving={saving === "order"}
                  isAnySaving={saving !== null}
                  isOpenMore={Boolean(openMore[j.jobId])}
                  isMoveOpen={moveOpenFor === j.jobId}
                  moveToDate={moveOpenFor === j.jobId ? moveToDate : ""}
                  onPersist={persistState}
                  onNotHome={notHome}
                  onToggleMore={toggleMore}
                  onOpenMove={openMove}
                  onSetMoveToDate={setMoveToDate}
                  onMoveUp={moveUp}
                  onMoveDown={moveDown}
                  onRemoveFromWeek={removeJobFromWeek}
                  onDeleteOneOff={deleteOneOff}
                  onMoveTo={moveJobTo}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>

      {saving === "order" ? (
        <p className="text-xs font-medium text-zinc-500">Saving order…</p>
      ) : null}
    </div>
  );
}

const JobRow = memo(function JobRow({
  job: j,
  idx,
  isLast,
  compactMode,
  reorderMode,
  isSaving,
  isOrderSaving,
  isAnySaving,
  isOpenMore,
  isMoveOpen,
  moveToDate,
  onPersist,
  onNotHome,
  onToggleMore,
  onOpenMove,
  onSetMoveToDate,
  onMoveUp,
  onMoveDown,
  onRemoveFromWeek,
  onDeleteOneOff,
  onMoveTo,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  job: DayJobVM;
  idx: number;
  isLast: boolean;
  compactMode: boolean;
  reorderMode: boolean;
  isSaving: boolean;
  isOrderSaving: boolean;
  isAnySaving: boolean;
  isOpenMore: boolean;
  isMoveOpen: boolean;
  moveToDate: string;
  onPersist: (jobId: string, patch: Partial<DayJobVM>, quiet?: boolean) => void;
  onNotHome: (job: DayJobVM) => void;
  onToggleMore: (jobId: string) => void;
  onOpenMove: (jobId: string) => void;
  onSetMoveToDate: (v: string) => void;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
  onRemoveFromWeek: (job: DayJobVM) => void;
  onDeleteOneOff: (jobId: string) => void;
  onMoveTo: (job: DayJobVM, toDate: string) => void;
  onDragStart: (jobId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (jobId: string) => void;
}) {
  const editHref = customerEditHref(j.jobId);
  const done = j.cleaned && j.collected;

  return (
    <li
      draggable={reorderMode}
      onDragStart={() => onDragStart(j.jobId)}
      onDragOver={onDragOver}
      onDrop={() => onDrop(j.jobId)}
    >
      <SwipeableJobRow
        disabled={reorderMode}
        rightLabel="Paid"
        leftLabel={j.skipped ? "Unskip" : "Skip"}
        onSwipeRight={() => onPersist(j.jobId, { collected: true, paymentType: j.paymentType ?? "cash" })}
        onSwipeLeft={() => onPersist(j.jobId, { skipped: !j.skipped }, true)}
      >
        <div
          className={[
            "rounded-3xl border bg-white p-4 shadow-sm",
            j.skipped ? "border-zinc-300 opacity-60" : "border-zinc-200",
            compactMode ? "p-3" : "",
          ].join(" ")}
        >
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={["truncate font-semibold text-zinc-900", compactMode ? "text-lg" : "text-base"].join(" ")}>
                    {j.title}
                  </p>
                  {j.isFirstVisit ? (
                    <span className="rounded-full bg-[var(--brand-tint)] px-2 py-0.5 text-xs font-semibold text-[var(--brand-dark)]">
                      First visit
                    </span>
                  ) : null}
                  {j.skipped ? (
                    <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                      Not home
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 line-clamp-2 text-sm text-zinc-600">{j.subtitle}</p>
              </div>
              {!compactMode ? (
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-zinc-900">
                    {formatMoneyPounds(j.pricePence)}
                  </p>
                </div>
              ) : null}
            </div>

            {j.customerNotes ? (
              <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5">
                <p className="text-xs font-semibold text-amber-800">Note</p>
                <p className="mt-0.5 text-sm text-amber-900">{j.customerNotes}</p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => {
                const next = !done;
                onPersist(j.jobId, {
                  cleaned: next,
                  collected: next,
                  paymentType: next ? j.paymentType ?? "cash" : j.paymentType,
                });
              }}
              className={[
                "mt-3 w-full rounded-full font-semibold shadow-sm",
                compactMode ? "h-14 text-lg" : "h-12 text-base",
                done
                  ? "bg-zinc-900 text-white hover:bg-zinc-800"
                  : "bg-emerald-600 text-white hover:bg-emerald-500",
              ].join(" ")}
            >
              {done ? "Done ✓" : "Mark done"}
            </button>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onPersist(j.jobId, { cleaned: !j.cleaned })}
                className={[
                  "h-12 rounded-full text-sm font-semibold shadow-sm",
                  j.cleaned
                    ? "bg-emerald-600/15 text-emerald-800 ring-1 ring-emerald-600/30"
                    : "border border-zinc-200 bg-white text-zinc-700",
                ].join(" ")}
              >
                Cleaned
              </button>
              <button
                type="button"
                onClick={() => onPersist(j.jobId, { collected: !j.collected })}
                className={[
                  "h-12 rounded-full text-sm font-semibold shadow-sm",
                  j.collected
                    ? "bg-amber-600/15 text-amber-900 ring-1 ring-amber-600/30"
                    : "border border-zinc-200 bg-white text-zinc-700",
                ].join(" ")}
              >
                Collected
              </button>
            </div>

            {j.collected ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {(["cash", "bank", "card"] as PaymentType[]).map((pt) => (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => onPersist(j.jobId, { paymentType: pt })}
                    className={[
                      "h-9 rounded-full px-3 text-xs font-semibold capitalize",
                      j.paymentType === pt
                        ? "bg-zinc-900 text-white"
                        : "border border-zinc-200 bg-white text-zinc-700",
                    ].join(" ")}
                  >
                    {pt}
                  </button>
                ))}
              </div>
            ) : null}

            {j.smsSentAt ? (
              <p className="mt-2 text-xs font-medium text-sky-700">Text marked done</p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <a
                href={mapsHref(j.subtitle)}
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 rounded-full border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 inline-flex items-center"
              >
                Map
              </a>
              {j.phone ? (
                <>
                  <a
                    href={`tel:${j.phone}`}
                    className="h-12 rounded-full border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 inline-flex items-center"
                  >
                    Call
                  </a>
                  <a
                    href={`sms:${j.phone}`}
                    className="h-12 rounded-full border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 inline-flex items-center"
                  >
                    Text
                  </a>
                </>
              ) : editHref ? (
                <Link
                  href={editHref}
                  className="h-12 rounded-full border border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-amber-900 shadow-sm hover:bg-amber-100 inline-flex items-center"
                >
                  Add phone
                </Link>
              ) : null}

              <button
                type="button"
                onClick={() => onNotHome(j)}
                className="h-12 rounded-full border border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-amber-900"
              >
                Not home
              </button>

              <button
                type="button"
                onClick={() => onToggleMore(j.jobId)}
                className="h-12 rounded-full border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
              >
                {isOpenMore ? "Less" : "More"}
              </button>

              {reorderMode ? (
                <>
                  <button
                    type="button"
                    onClick={() => onMoveUp(idx)}
                    className="h-12 rounded-full border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-40"
                    disabled={idx === 0 || isOrderSaving}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveDown(idx)}
                    className="h-12 rounded-full border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-40"
                    disabled={isLast || isOrderSaving}
                  >
                    Down
                  </button>
                </>
              ) : null}
            </div>

            {isOpenMore ? (
              <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenMove(j.jobId)}
                    className="h-12 rounded-full bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
                  >
                    Move
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveFromWeek(j)}
                    className="h-12 rounded-full bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-40"
                    disabled={isAnySaving}
                  >
                    Remove from week
                  </button>

                  {j.deletable ? (
                    <button
                      type="button"
                      onClick={() => onDeleteOneOff(j.jobId)}
                      className="h-12 rounded-full border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50"
                      disabled={isAnySaving}
                    >
                      Delete one-off
                    </button>
                  ) : null}
                </div>

                <label className="mt-3 block">
                  <span className="text-sm font-semibold text-zinc-900">Note</span>
                  <textarea
                    defaultValue={j.visitNote}
                    placeholder="Visit note (e.g. dog was loose)…"
                    onBlur={(e) => {
                      const v = e.currentTarget.value;
                      if (v === j.visitNote) return;
                      onPersist(j.jobId, { visitNote: v });
                    }}
                    className="mt-1 min-h-[44px] w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
                  />
                </label>
              </div>
            ) : null}

            {isMoveOpen ? (
              <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-sm font-semibold text-zinc-900">Move to</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const toDate = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
                      onMoveTo(j, toDate);
                    }}
                    className="h-12 rounded-full bg-white text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
                    disabled={isAnySaving}
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const toDate = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
                      onMoveTo(j, toDate);
                    }}
                    className="h-12 rounded-full bg-white text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
                    disabled={isAnySaving}
                  >
                    Tomorrow
                  </button>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="date"
                    value={moveToDate}
                    onChange={(e) => onSetMoveToDate(e.target.value)}
                    className="h-12 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!moveToDate) return;
                      onMoveTo(j, moveToDate);
                    }}
                    className="h-12 rounded-full bg-zinc-900 px-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-40"
                    disabled={isAnySaving || !moveToDate}
                  >
                    Move
                  </button>
                </div>

                {j.kind === "scheduled" && j.street ? (
                  <p className="mt-2 text-xs text-zinc-600">
                    This will move everyone on <span className="font-semibold">{j.street}</span>{" "}
                    who is on this day (keeps streets aligned).
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {isSaving ? <p className="mt-2 text-xs font-medium text-zinc-500">Saving…</p> : null}
        </div>
      </SwipeableJobRow>
    </li>
  );
});

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
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900">One-off job</p>
          <p className="mt-0.5 text-xs text-zinc-600">Walk-up customer just for today.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="h-10 rounded-full bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-40"
          disabled={disabled}
        >
          {open ? "Close" : "Add"}
        </button>
      </div>

      {open ? (
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-zinc-900">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-zinc-900">Address</span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="text-sm font-medium text-zinc-900">Phone</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-zinc-900">Price (£)</span>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
                className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
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
            className="h-12 rounded-full bg-[var(--brand)] text-base font-semibold text-white shadow-sm hover:bg-[var(--brand-dark)] disabled:opacity-40"
          >
            Save one-off
          </button>
        </div>
      ) : null}
    </div>
  );
}
