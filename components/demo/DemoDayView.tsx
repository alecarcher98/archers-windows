"use client";

import { useMemo, useState } from "react";
import type { DayJobVM } from "@/lib/dayJobVm";
import type { PaymentType } from "@/lib/models";
import { mapsHref, whatsAppHref } from "@/lib/phoneUtils";
import { buildCustomerMessage } from "@/lib/messageTemplate";
import { DEMO_SETTINGS } from "@/lib/demoSeed";
import { useDemo } from "@/components/demo/DemoProvider";

function formatMoneyPounds(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

export function DemoDayView() {
  const { today, jobs, updateJobState, markStreetDone } = useDemo();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const streetGroups = useMemo(() => {
    const map = new Map<string, DayJobVM[]>();
    for (const j of jobs) {
      const key = j.street?.trim() || "Other";
      const list = map.get(key) ?? [];
      list.push(j);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [jobs]);

  const stats = useMemo(() => {
    const active = jobs.filter((j) => !j.skipped);
    const expected = active.reduce((s, j) => s + j.pricePence, 0);
    const collected = active.filter((j) => j.collected).reduce((s, j) => s + j.pricePence, 0);
    const done = active.filter((j) => j.cleaned && j.collected).length;
    return { expected, collected, done, total: active.length };
  }, [jobs]);

  const toText = useMemo(
    () => jobs.filter((j) => j.cleaned && j.collected && !j.smsSentAt),
    [jobs],
  );

  async function copyMessage(j: DayJobVM) {
    const text = buildCustomerMessage(
      DEMO_SETTINGS,
      today ?? "",
      j.pricePence,
      j.title,
      j.subtitle,
      j.phone ?? "",
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(j.jobId);
      setTimeout(() => setCopiedId((id) => (id === j.jobId ? null : id)), 2000);
    } catch {
      /* clipboard permissions can fail silently in a sandbox — not critical */
    }
  }

  if (!jobs.length) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Today</p>
            <p className="text-lg font-bold text-zinc-900">
              {stats.done}/{stats.total} done
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="text-zinc-600">Expected {formatMoneyPounds(stats.expected)}</p>
            <p className="font-semibold text-zinc-900">
              Collected {formatMoneyPounds(stats.collected)}
            </p>
          </div>
        </div>
      </div>

      {toText.length ? (
        <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-4 py-3">
            <p className="text-sm font-semibold text-zinc-900">Texts to send ({toText.length})</p>
            <p className="mt-0.5 text-sm text-zinc-600">
              Copy each message and tick it off once sent.
            </p>
          </div>
          <ul className="divide-y divide-zinc-200">
            {toText.map((j) => (
              <li key={j.jobId} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">{j.title}</p>
                  {j.phone ? (
                    <a
                      href={whatsAppHref(j.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-emerald-700 underline"
                    >
                      WhatsApp
                    </a>
                  ) : (
                    <span className="text-xs text-amber-700">No phone</span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void copyMessage(j)}
                    className="h-9 rounded-full border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
                  >
                    {copiedId === j.jobId ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateJobState(j.jobId, { smsSentAt: Date.now() })}
                    className="h-9 rounded-full bg-[var(--brand)] px-3 text-xs font-semibold text-white hover:bg-[var(--brand-dark)]"
                  >
                    Texted
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        {streetGroups.map(([street, streetJobs]) => (
          <div key={street}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-zinc-800">{street}</p>
              <button
                type="button"
                onClick={() => markStreetDone(street)}
                className="h-9 rounded-full bg-zinc-900 px-3 text-xs font-semibold text-white"
              >
                Mark street done
              </button>
            </div>
            <ul className="space-y-3">
              {streetJobs.map((j) => (
                <DemoJobCard key={j.jobId} job={j} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function DemoJobCard({ job: j }: { job: DayJobVM }) {
  const { updateJobState } = useDemo();

  return (
    <li
      className={[
        "rounded-3xl border bg-white p-4 shadow-sm",
        j.skipped ? "border-zinc-300 opacity-60" : "border-zinc-200",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold text-zinc-900">{j.title}</p>
            {j.isFirstVisit ? (
              <span className="rounded-full bg-[var(--brand-tint)] px-2 py-0.5 text-xs font-semibold text-[var(--brand-dark)]">
                First visit
              </span>
            ) : null}
            {j.skipped ? (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500">
                Not home
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-zinc-600">{j.subtitle}</p>
        </div>
        <p className="shrink-0 text-sm font-semibold text-zinc-900">
          {formatMoneyPounds(j.pricePence)}
        </p>
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
          const done = !(j.cleaned && j.collected);
          updateJobState(j.jobId, {
            cleaned: done,
            collected: done,
            paymentType: done ? j.paymentType ?? "cash" : j.paymentType,
          });
        }}
        className={[
          "mt-3 h-12 w-full rounded-full text-base font-semibold shadow-sm",
          j.cleaned && j.collected
            ? "bg-zinc-900 text-white hover:bg-zinc-800"
            : "bg-emerald-600 text-white hover:bg-emerald-500",
        ].join(" ")}
      >
        {j.cleaned && j.collected ? "Done ✓" : "Mark done"}
      </button>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => updateJobState(j.jobId, { cleaned: !j.cleaned })}
          className={[
            "h-10 rounded-full text-sm font-semibold shadow-sm",
            j.cleaned
              ? "bg-emerald-600/15 text-emerald-800 ring-1 ring-emerald-600/30"
              : "border border-zinc-200 bg-white text-zinc-700",
          ].join(" ")}
        >
          Cleaned
        </button>
        <button
          type="button"
          onClick={() => updateJobState(j.jobId, { collected: !j.collected })}
          className={[
            "h-10 rounded-full text-sm font-semibold shadow-sm",
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
              onClick={() => updateJobState(j.jobId, { paymentType: pt })}
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

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={mapsHref(j.subtitle)}
          target="_blank"
          rel="noopener noreferrer"
          className="h-10 rounded-full border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
        >
          Map
        </a>
        {j.phone ? (
          <a
            href={`tel:${j.phone}`}
            className="h-10 rounded-full border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
          >
            Call
          </a>
        ) : (
          <span className="h-10 rounded-full border border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-amber-900 inline-flex items-center">
            No phone on file
          </span>
        )}
        <button
          type="button"
          onClick={() => updateJobState(j.jobId, { skipped: !j.skipped })}
          className="h-10 rounded-full border border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-amber-900"
        >
          {j.skipped ? "Undo not home" : "Not home"}
        </button>
      </div>

      <textarea
        defaultValue={j.visitNote}
        placeholder="Visit note (e.g. dog was loose)…"
        onBlur={(e) => {
          const v = e.currentTarget.value;
          if (v === j.visitNote) return;
          updateJobState(j.jobId, { visitNote: v });
        }}
        className="mt-3 min-h-[44px] w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
      />
    </li>
  );
}
