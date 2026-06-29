"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DayJobVM } from "@/lib/dayJobVm";
import type { AppSettings } from "@/lib/models";
import { buildCustomerMessage } from "@/lib/messageTemplate";
import { whatsAppHref } from "@/lib/phoneUtils";

async function patchTextDone(date: string, jobId: string, done: boolean) {
  const res = await fetch(`/api/day/${date}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jobState: {
        [jobId]: { smsSentAt: done ? Date.now() : null },
      },
    }),
  });
  if (!res.ok) throw new Error("Failed");
}

function copyText(text: string) {
  return navigator.clipboard.writeText(text);
}

export function TextChecklist({
  date,
  jobs,
  settings,
}: {
  date: string;
  jobs: DayJobVM[];
  settings: AppSettings;
}) {
  const [localJobs, setLocalJobs] = useState(jobs);

  useEffect(() => {
    setLocalJobs(jobs);
  }, [jobs]);
  const [pending, setPending] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const completed = useMemo(
    () => localJobs.filter((j) => j.cleaned && j.collected),
    [localJobs],
  );

  const toText = useMemo(() => completed.filter((j) => !j.smsSentAt), [completed]);
  const texted = useMemo(() => completed.filter((j) => j.smsSentAt), [completed]);

  const sampleMessage = useMemo(() => {
    const sample = toText[0] ?? texted[0] ?? completed[0];
    if (!sample) return buildCustomerMessage(settings, date, 0, "Customer", "Address");
    return buildCustomerMessage(
      settings,
      date,
      sample.pricePence,
      sample.title,
      sample.subtitle,
      sample.phone ?? "",
    );
  }, [completed, date, settings, texted, toText]);

  async function toggleDone(jobId: string, done: boolean) {
    setPending(jobId);
    setError(null);
    setLocalJobs((prev) =>
      prev.map((j) =>
        j.jobId === jobId ? { ...j, smsSentAt: done ? Date.now() : undefined } : j,
      ),
    );
    try {
      await patchTextDone(date, jobId, done);
    } catch {
      setError("Couldn’t save. Try again.");
      setLocalJobs(jobs);
    } finally {
      setPending(null);
    }
  }

  async function onCopy(job: DayJobVM) {
    const text = buildCustomerMessage(
      settings,
      date,
      job.pricePence,
      job.title,
      job.subtitle,
      job.phone ?? "",
    );
    try {
      await copyText(text);
      setCopiedId(job.jobId);
      setTimeout(() => setCopiedId((id) => (id === job.jobId ? null : id)), 2000);
    } catch {
      setError("Could not copy — check browser permissions.");
    }
  }

  async function copyAllMessages() {
    const text = toText
      .map((j, i) => {
        const body = buildCustomerMessage(
          settings,
          date,
          j.pricePence,
          j.title,
          j.subtitle,
          j.phone ?? "",
        );
        return `--- ${i + 1}. ${j.title} ---\n${body}`;
      })
      .join("\n\n");
    try {
      await copyText(text);
      showCopied("all");
    } catch {
      setError("Could not copy.");
    }
  }

  function showCopied(id: string) {
    setCopiedId(id);
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
  }

  async function copyAllPhones() {
    const phones = toText.map((j) => j.phone?.trim()).filter(Boolean).join(", ");
    if (!phones) return;
    try {
      await copyText(phones);
      showCopied("phones");
    } catch {
      setError("Could not copy phones.");
    }
  }

  if (!completed.length) return null;

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-4 py-3">
        <p className="text-sm font-semibold text-zinc-900">Texts to send</p>
        <p className="mt-1 text-sm text-zinc-600">
          {toText.length
            ? `${toText.length} to do · ${texted.length} done`
            : `All ${texted.length} marked as texted.`}{" "}
          Copy each message, send from your phone, then tick off.
        </p>
      </div>

      <div className="px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Message template
        </p>
        <pre className="mt-2 whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800">
          {sampleMessage}
        </pre>
        <p className="mt-2 text-xs text-zinc-500">
          Edit in{" "}
          <Link href="/settings" className="font-semibold underline">
            Settings
          </Link>
          . Uses{" "}
          <code className="text-[11px]">{"{{greeting}}"}</code>,{" "}
          <code className="text-[11px]">{"{{todayDate}}"}</code>,{" "}
          <code className="text-[11px]">{"{{houseValue}}"}</code>,{" "}
          <code className="text-[11px]">{"{{customerName}}"}</code>,{" "}
          <code className="text-[11px]">{"{{phone}}"}</code>.
        </p>
        {toText.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyAllMessages()}
              className="h-10 rounded-full bg-[var(--brand)] px-3 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]"
            >
              {copiedId === "all" ? "Copied all" : "Copy all messages"}
            </button>
            <button
              type="button"
              onClick={() => void copyAllPhones()}
              className="h-10 rounded-full border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900"
            >
              {copiedId === "phones" ? "Copied" : "Copy phone list"}
            </button>
          </div>
        ) : null}
      </div>

      {error ? <p className="px-4 pb-2 text-sm font-medium text-red-700">{error}</p> : null}

      {toText.length ? (
        <ul className="divide-y divide-zinc-200">
          {toText.map((j) => (
            <TextRow
              key={j.jobId}
              job={j}
              pending={pending === j.jobId}
              copied={copiedId === j.jobId}
              onCopy={() => void onCopy(j)}
              onToggle={(done) => void toggleDone(j.jobId, done)}
            />
          ))}
        </ul>
      ) : null}

      {texted.length ? (
        <div className={toText.length ? "border-t border-zinc-200" : ""}>
          <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Texted
          </p>
          <ul className="divide-y divide-zinc-200">
            {texted.map((j) => (
              <TextRow
                key={j.jobId}
                job={j}
                done
                pending={pending === j.jobId}
                copied={copiedId === j.jobId}
                onCopy={() => void onCopy(j)}
                onToggle={(checked) => void toggleDone(j.jobId, checked)}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function TextRow({
  job,
  done,
  pending,
  copied,
  onCopy,
  onToggle,
}: {
  job: DayJobVM;
  done?: boolean;
  pending: boolean;
  copied: boolean;
  onCopy: () => void;
  onToggle: (checked: boolean) => void;
}) {
  const pounds = `£${(job.pricePence / 100).toFixed(2)}`;

  return (
    <li
      className={[
        "flex gap-3 px-4 py-3",
        done ? "opacity-70" : "",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={Boolean(job.smsSentAt)}
        disabled={pending}
        onChange={(e) => onToggle(e.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 rounded border-zinc-300"
        aria-label={`Mark ${job.title} as texted`}
      />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-zinc-900">{job.title}</p>
        <p className="mt-0.5 text-sm text-zinc-600">{job.subtitle}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-700">
          {job.phone ? (
            <>
              <span>{job.phone}</span>
              <a
                href={whatsAppHref(job.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-emerald-700 underline"
              >
                WhatsApp
              </a>
            </>
          ) : (
            <span className="text-amber-700">No phone</span>
          )}
          <span className="font-medium">{pounds}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onCopy}
        disabled={pending}
        className="h-10 shrink-0 self-center rounded-full border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-40"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </li>
  );
}
