"use client";

import { useMemo, useState } from "react";
import { formatDisplayDate } from "@/lib/formatDate";
import {
  PhoneIcon,
  PlusIcon,
  SearchIcon,
  avatarPalette,
  initialsFromName,
} from "@/components/Icons";
import { useDemo } from "@/components/demo/DemoProvider";

function formatMoneyPounds(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

export function DemoCustomersView() {
  const { customers } = useDemo();
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.address.toLowerCase().includes(query) ||
        (c.street ?? "").toLowerCase().includes(query),
    );
  }, [customers, q]);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, address, street…"
            className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-3 text-base outline-none transition focus:border-[var(--brand)] focus:bg-white focus:ring-2 focus:ring-[var(--brand-tint)]"
          />
        </div>
      </div>

      <AddDemoCustomerCard open={addOpen} onOpenChange={setAddOpen} />

      <ul className="flex flex-col gap-2.5">
        {filtered.map((c) => (
          <li
            key={c.id}
            className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
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
              <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{c.address}</p>
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
                  {c.oneOff ? "One-off" : `Every ${c.frequencyWeeks}w`}
                </span>
                {c.pausedUntil ? (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    Paused until {formatDisplayDate(c.pausedUntil)}
                  </span>
                ) : null}
              </div>
              {c.notes ? (
                <p className="mt-2 line-clamp-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                  Note: {c.notes}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddDemoCustomerCard({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addCustomer } = useDemo();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [street, setStreet] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("18.00");
  const [frequencyWeeks, setFrequencyWeeks] = useState(4);
  const [oneOff, setOneOff] = useState(false);

  function reset() {
    setName("");
    setAddress("");
    setStreet("");
    setPhone("");
    setNotes("");
    setPrice("18.00");
    setFrequencyWeeks(4);
    setOneOff(false);
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900">Add a customer</p>
          <p className="mt-0.5 text-xs text-zinc-600">
            Try it — new customers due today appear straight back on Schedule.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--brand)] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-dark)]"
        >
          <PlusIcon className="h-4 w-4" />
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
              <span className="text-sm font-medium text-zinc-900">Street</span>
              <input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-zinc-900">Phone</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="text-sm font-medium text-zinc-900">Price (£)</span>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
                className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-zinc-900">Frequency</span>
              <div className="flex gap-2">
                {[4, 8].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setFrequencyWeeks(n);
                      setOneOff(false);
                    }}
                    className={[
                      "h-12 flex-1 rounded-xl text-sm font-semibold",
                      !oneOff && frequencyWeeks === n
                        ? "bg-[var(--brand)] text-white"
                        : "border border-zinc-200 text-zinc-600",
                    ].join(" ")}
                  >
                    {n}w
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setOneOff(true)}
                  className={[
                    "h-12 flex-1 rounded-xl text-sm font-semibold",
                    oneOff ? "bg-zinc-900 text-white" : "border border-zinc-200 text-zinc-600",
                  ].join(" ")}
                >
                  One-off
                </button>
              </div>
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-sm font-medium text-zinc-900">Notes (e.g. gate code)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Gate code is 1234"
              className="min-h-[44px] w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              const pounds = Number(price.replaceAll(",", ".").trim());
              const pricePence = Math.round(pounds * 100);
              if (!name.trim() || !address.trim() || !Number.isFinite(pricePence)) return;
              addCustomer({
                name: name.trim(),
                address: address.trim(),
                street: street.trim(),
                phone: phone.trim(),
                notes: notes.trim(),
                pricePence,
                frequencyWeeks: oneOff ? 1 : frequencyWeeks,
                oneOff,
              });
              reset();
              onOpenChange(false);
            }}
            className="h-12 rounded-full bg-zinc-900 text-base font-semibold text-white shadow-sm hover:bg-zinc-800"
          >
            Add customer
          </button>
        </div>
      ) : null}
    </div>
  );
}
