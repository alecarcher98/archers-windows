"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { findDuplicateWarnings } from "@/lib/customerUtils";
import { formatDisplayDate } from "@/lib/formatDate";
import type { Customer, IsoDate } from "@/lib/models";
import { avatarPalette, initialsFromName } from "@/components/Icons";

type CustomerInput = {
  name: string;
  address: string;
  street: string;
  phone: string;
  notes: string;
  pausedUntil: string;
  defaultPricePounds: string;
  startDate: string;
  frequencyWeeks: number | "custom";
  customFrequencyWeeks: string;
  active: boolean;
};

function poundsStringFromPence(pence: number) {
  return (pence / 100).toFixed(2);
}

function penceFromPoundsString(value: string) {
  const normalized = value.replaceAll(",", ".").trim();
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

async function createCustomer(input: Omit<Customer, "id" | "priceHistory">) {
  const res = await fetch("/api/customers", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed");
  return (await res.json()) as { ok: true; customer: Customer };
}

async function updateCustomer(id: string, input: Omit<Customer, "id">) {
  const res = await fetch(`/api/customers/${id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed");
  return (await res.json()) as { ok: true; customer: Customer };
}

async function deleteCustomer(id: string) {
  const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed");
}

const presetFrequencies = [1, 2, 3, 4, 6, 8] as const;

const inputClasses =
  "h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base shadow-sm outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-tint)]";

export function CustomerForm({
  mode,
  customer,
}: {
  mode: "new" | "edit";
  customer?: Customer;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((j: { customers?: Customer[] }) => setAllCustomers(j.customers ?? []))
      .catch(() => null);
  }, []);

  const initial = useMemo<CustomerInput>(() => {
    const freq = customer?.frequencyWeeks ?? 4;
    const isPreset = presetFrequencies.includes(freq as (typeof presetFrequencies)[number]);
    return {
      name: customer?.name ?? "",
      address: customer?.address ?? "",
      street: customer?.street ?? "",
      phone: customer?.phone ?? "",
      notes: customer?.notes ?? "",
      pausedUntil: customer?.pausedUntil ?? "",
      defaultPricePounds: customer ? poundsStringFromPence(customer.defaultPricePence) : "0.00",
      startDate: customer?.startDate ?? "",
      frequencyWeeks: isPreset ? (freq as number) : "custom",
      customFrequencyWeeks: isPreset ? "" : String(freq),
      active: customer?.active ?? true,
    };
  }, [customer]);

  const [state, setState] = useState<CustomerInput>(initial);

  useEffect(() => {
    setWarnings(
      findDuplicateWarnings(allCustomers, {
        name: state.name,
        address: state.address,
        id: customer?.id,
      }),
    );
  }, [allCustomers, state.name, state.address, customer?.id]);

  const previewName = state.name.trim() || (mode === "new" ? "New client" : "Unnamed client");

  async function onSave() {
    setError(null);
    setSavedAt(null);
    setPending(true);

    try {
      const defaultPricePence = penceFromPoundsString(state.defaultPricePounds);
      const freq =
        state.frequencyWeeks === "custom"
          ? Number(state.customFrequencyWeeks)
          : state.frequencyWeeks;

      if (!state.name.trim() || !state.address.trim()) {
        setError("Name and address are required.");
        return;
      }
      if (!state.startDate) {
        setError("Start date is required.");
        return;
      }
      if (defaultPricePence === null) {
        setError("Enter a valid price.");
        return;
      }
      if (!Number.isFinite(freq) || freq <= 0) {
        setError("Enter a valid frequency.");
        return;
      }

      const payload: Omit<Customer, "id"> = {
        name: state.name.trim(),
        address: state.address.trim(),
        street: state.street.trim() || undefined,
        phone: state.phone.trim() || undefined,
        notes: state.notes.trim() || undefined,
        pausedUntil: (state.pausedUntil.trim() || undefined) as IsoDate | undefined,
        defaultPricePence,
        startDate: state.startDate as IsoDate,
        frequencyWeeks: Math.round(freq),
        active: state.active,
        priceHistory: customer?.priceHistory,
      };

      if (mode === "new") {
        const { priceHistory: _ph, ...createPayload } = payload;
        await createCustomer(createPayload);
      } else {
        await updateCustomer(customer!.id, payload);
      }

      setSavedAt(Date.now());
      router.replace("/customers");
      router.refresh();
    } catch {
      setError("Could not save to the database. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    if (!customer) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setError(null);
    setPending(true);
    try {
      await deleteCustomer(customer.id);
      router.replace("/customers");
      router.refresh();
    } catch {
      setError("Could not delete. Try again.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-28">
      <div className="flex items-center gap-3 rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-[var(--brand-tint)] p-4 shadow-sm">
        <div
          className={[
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-bold",
            avatarPalette(customer?.id ?? (state.name || "new")),
          ].join(" ")}
        >
          {initialsFromName(previewName)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-zinc-900">{previewName}</p>
          <p className="text-sm text-zinc-500">
            {mode === "new"
              ? "Fill in the details below — saved straight to your client database."
              : "Changes save directly to your client database."}
          </p>
        </div>
      </div>

      {warnings.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {warnings.map((w) => (
            <p key={w} className="flex items-start gap-1.5">
              <span aria-hidden>⚠</span>
              {w}
            </p>
          ))}
        </div>
      ) : null}

      <FormSection title="Contact details" subtitle="Who they are and where to find them">
        <Field label="Name">
          <input
            value={state.name}
            onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
            placeholder="e.g. Jane Smith"
            className={inputClasses}
          />
        </Field>

        <Field label="Address">
          <input
            value={state.address}
            onChange={(e) => setState((s) => ({ ...s, address: e.target.value }))}
            placeholder="e.g. 12 Oak Road, Bristol"
            className={inputClasses}
          />
        </Field>

        <Field label="Street/Area (optional)">
          <input
            value={state.street}
            onChange={(e) => setState((s) => ({ ...s, street: e.target.value }))}
            placeholder="e.g. Oak Road"
            className={inputClasses}
          />
        </Field>

        <Field label="Phone">
          <input
            value={state.phone}
            onChange={(e) => setState((s) => ({ ...s, phone: e.target.value }))}
            inputMode="tel"
            placeholder="e.g. 07700 900123"
            className={inputClasses}
          />
        </Field>
      </FormSection>

      <FormSection title="Schedule & pricing" subtitle="How often you visit and what it costs">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (£)">
            <input
              value={state.defaultPricePounds}
              onChange={(e) => setState((s) => ({ ...s, defaultPricePounds: e.target.value }))}
              inputMode="decimal"
              className={inputClasses}
            />
          </Field>
          <Field label="Start date">
            <input
              type="date"
              value={state.startDate}
              onChange={(e) => setState((s) => ({ ...s, startDate: e.target.value }))}
              className={inputClasses}
            />
          </Field>
        </div>

        <Field label="Frequency">
          <div className="flex flex-wrap gap-2">
            {presetFrequencies.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setState((s) => ({ ...s, frequencyWeeks: n }))}
                className={[
                  "h-10 rounded-full px-4 text-sm font-semibold transition",
                  state.frequencyWeeks === n
                    ? "bg-[var(--brand)] text-white shadow-sm"
                    : "border border-zinc-200 text-zinc-600 hover:border-zinc-300",
                ].join(" ")}
              >
                Every {n}w
              </button>
            ))}
            <button
              type="button"
              onClick={() => setState((s) => ({ ...s, frequencyWeeks: "custom" }))}
              className={[
                "h-10 rounded-full px-4 text-sm font-semibold transition",
                state.frequencyWeeks === "custom"
                  ? "bg-[var(--brand)] text-white shadow-sm"
                  : "border border-zinc-200 text-zinc-600 hover:border-zinc-300",
              ].join(" ")}
            >
              Custom…
            </button>
          </div>
        </Field>

        {state.frequencyWeeks === "custom" ? (
          <Field label="Custom frequency (weeks)">
            <input
              value={state.customFrequencyWeeks}
              onChange={(e) => setState((s) => ({ ...s, customFrequencyWeeks: e.target.value }))}
              inputMode="numeric"
              placeholder="e.g. 5"
              className={inputClasses}
            />
          </Field>
        ) : null}

        <Field label="Paused until (optional)">
          <input
            type="date"
            value={state.pausedUntil}
            onChange={(e) => setState((s) => ({ ...s, pausedUntil: e.target.value }))}
            className={inputClasses}
          />
        </Field>

        {customer?.priceHistory?.length ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm">
            <p className="font-semibold text-zinc-900">Price history</p>
            <ul className="mt-2 space-y-1 text-zinc-600">
              {customer.priceHistory.map((h) => (
                <li key={h.changedAt}>
                  {formatDisplayDate(h.effectiveDate)}: £{(h.pricePence / 100).toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </FormSection>

      <FormSection title="Notes & status" subtitle="Anything worth remembering on every visit">
        <Field label="Permanent notes (gate, dog, etc.)">
          <textarea
            value={state.notes}
            onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
            rows={3}
            placeholder="e.g. Side gate code 4321, friendly dog in the garden"
            className="min-h-[88px] w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base shadow-sm outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-tint)]"
          />
        </Field>

        <ToggleField
          label="Active"
          description="Switch off to pause scheduling for this client without deleting them"
          checked={state.active}
          onChange={(checked) => setState((s) => ({ ...s, active: checked }))}
        />
      </FormSection>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      {savedAt ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Saved to the database.
        </p>
      ) : null}

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-lg items-center gap-2">
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={pending}
            className="h-12 flex-1 rounded-full bg-[var(--brand)] text-base font-semibold text-white shadow-md transition hover:bg-[var(--brand-dark)] active:scale-[0.99] disabled:opacity-40"
          >
            {pending ? "Saving…" : mode === "new" ? "Add client" : "Save changes"}
          </button>

          {mode === "edit" ? (
            <button
              type="button"
              onClick={() => void onDelete()}
              onBlur={() => setConfirmDelete(false)}
              disabled={pending}
              className={[
                "h-12 shrink-0 rounded-full border px-4 text-sm font-semibold transition disabled:opacity-40",
                confirmDelete
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-red-200 text-red-700 hover:bg-red-50",
              ].join(" ")}
            >
              {confirmDelete ? "Confirm delete?" : "Delete"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FormSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--brand-dark)]">
          {title}
        </h2>
        {subtitle ? <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p> : null}
      </div>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium text-zinc-900">{label}</span>
      {children}
    </label>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-3 py-3 text-left transition hover:border-zinc-300"
    >
      <span>
        <span className="block text-sm font-semibold text-zinc-900">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-zinc-500">{description}</span>
        ) : null}
      </span>
      <span
        className={[
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition",
          checked ? "bg-[var(--brand)]" : "bg-zinc-200",
        ].join(" ")}
      >
        <span
          className={[
            "absolute h-5 w-5 rounded-full bg-white shadow transition",
            checked ? "translate-x-6" : "translate-x-1",
          ].join(" ")}
        />
      </span>
    </button>
  );
}
