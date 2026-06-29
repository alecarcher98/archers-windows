"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDisplayDate } from "@/lib/formatDate";
import type { Customer } from "@/lib/models";
import {
  ChevronRightIcon,
  DownloadIcon,
  MapPinIcon,
  PhoneIcon,
  SearchIcon,
  UploadIcon,
  XIcon,
  avatarPalette,
  initialsFromName,
} from "@/components/Icons";

function formatMoneyPounds(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

type Filter = "all" | "active" | "paused" | "no-phone";

export function CustomersClient({ customers }: { customers: Customer[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      all: customers.length,
      active: customers.filter((c) => c.active).length,
      paused: customers.filter((c) => !c.active).length,
      "no-phone": customers.filter((c) => !c.phone?.trim()).length,
    }),
    [customers],
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return customers.filter((c) => {
      if (filter === "active" && !c.active) return false;
      if (filter === "paused" && c.active) return false;
      if (filter === "no-phone" && c.phone?.trim()) return false;
      if (!query) return true;
      return (
        c.name.toLowerCase().includes(query) ||
        c.address.toLowerCase().includes(query) ||
        (c.phone ?? "").includes(query) ||
        (c.street ?? "").toLowerCase().includes(query)
      );
    });
  }, [customers, filter, q]);

  async function onImport(file: File) {
    setImporting(true);
    setMessage(null);
    try {
      const text = await file.text();
      const res = await fetch("/api/customers/import", {
        method: "POST",
        headers: { "content-type": "text/csv" },
        body: text,
      });
      const json = (await res.json()) as {
        ok?: boolean;
        imported?: number;
        errors?: string[];
        error?: string;
      };
      if (!res.ok || !json.ok) {
        setMessage(json.error ?? "Import failed");
        return;
      }
      setMessage(`Imported ${json.imported ?? 0} customers.`);
      if (json.errors?.length) setMessage((m) => `${m} ${json.errors!.length} row warnings.`);
      window.location.reload();
    } catch {
      setMessage("Import failed");
    } finally {
      setImporting(false);
    }
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "paused", label: "Paused" },
    { id: "no-phone", label: "No phone" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, address, phone…"
            className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-10 text-base outline-none transition focus:border-[var(--brand)] focus:bg-white focus:ring-2 focus:ring-[var(--brand-tint)]"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            >
              <XIcon className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {filters.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={[
                "h-9 rounded-full px-3.5 text-sm font-semibold transition",
                filter === id
                  ? "bg-[var(--brand)] text-white shadow-sm"
                  : "border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900",
              ].join(" ")}
            >
              {label}
              <span
                className={[
                  "ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-bold",
                  filter === id ? "bg-white/20" : "bg-zinc-100 text-zinc-500",
                ].join(" ")}
              >
                {counts[id]}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="/api/customers/export"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-zinc-200 px-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
          >
            <DownloadIcon className="h-4 w-4" />
            Export CSV
          </a>
          <label className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-zinc-200 px-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50">
            <UploadIcon className="h-4 w-4" />
            {importing ? "Importing…" : "Import CSV"}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={importing}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onImport(f);
              }}
            />
          </label>
        </div>
        {message ? <p className="mt-2 text-sm text-zinc-600">{message}</p> : null}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-zinc-600">
            {q ? `No clients match “${q}”.` : "No clients match this filter."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {filtered.map((c) => (
            <li key={c.id}>
              <Link
                href={`/customers/${c.id}`}
                className="group flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--brand)]/40 hover:shadow-md"
              >
                <div
                  className={[
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold",
                    avatarPalette(c.id),
                  ].join(" ")}
                >
                  {initialsFromName(c.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-base font-semibold text-zinc-900">{c.name}</p>
                    <span
                      className={[
                        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                        c.active ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600",
                      ].join(" ")}
                    >
                      {c.active ? "Active" : "Paused off"}
                    </span>
                  </div>

                  <p className="mt-1 flex items-start gap-1.5 text-sm text-zinc-600">
                    <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <span className="line-clamp-2">{c.address}</span>
                  </p>

                  {c.phone ? (
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                      <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      {c.phone}
                    </p>
                  ) : (
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-amber-700">
                      <PhoneIcon className="h-3.5 w-3.5 shrink-0" />
                      No phone on file
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-[var(--brand-tint)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-dark)]">
                      {formatMoneyPounds(c.defaultPricePence)}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
                      Every {c.frequencyWeeks}w
                    </span>
                    {c.pausedUntil ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        Paused until {formatDisplayDate(c.pausedUntil)}
                      </span>
                    ) : null}
                  </div>
                </div>

                <ChevronRightIcon className="mt-3 h-5 w-5 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-[var(--brand)]" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
