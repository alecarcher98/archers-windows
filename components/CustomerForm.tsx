"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CustomerInput = {
  name: string;
  address: string;
  street: string;
  phone: string;
  defaultPricePounds: string;
  startDate: string; // YYYY-MM-DD
  frequencyWeeks: number | "custom";
  customFrequencyWeeks: string;
  active: boolean;
};

type CustomerApi = {
  id: string;
  name: string;
  address: string;
  street?: string;
  phone?: string;
  defaultPricePence: number;
  startDate: string;
  frequencyWeeks: number;
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

async function createCustomer(input: Omit<CustomerApi, "id">) {
  const res = await fetch("/api/customers", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed");
  return (await res.json()) as { ok: true; customer: CustomerApi };
}

async function updateCustomer(id: string, input: Omit<CustomerApi, "id">) {
  const res = await fetch(`/api/customers/${id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed");
  return (await res.json()) as { ok: true; customer: CustomerApi };
}

async function deleteCustomer(id: string) {
  const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed");
}

const presetFrequencies = [1, 2, 3, 4, 6, 8] as const;

export function CustomerForm({
  mode,
  customer,
}: {
  mode: "new" | "edit";
  customer?: CustomerApi;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initial = useMemo<CustomerInput>(() => {
    const freq = customer?.frequencyWeeks ?? 4;
    const isPreset = presetFrequencies.includes(freq as (typeof presetFrequencies)[number]);
    return {
      name: customer?.name ?? "",
      address: customer?.address ?? "",
      street: customer?.street ?? "",
      phone: customer?.phone ?? "",
      defaultPricePounds: customer ? poundsStringFromPence(customer.defaultPricePence) : "0.00",
      startDate: customer?.startDate ?? "",
      frequencyWeeks: isPreset ? (freq as number) : "custom",
      customFrequencyWeeks: isPreset ? "" : String(freq),
      active: customer?.active ?? true,
    };
  }, [customer]);

  const [state, setState] = useState<CustomerInput>(initial);

  async function onSave() {
    setError(null);
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

      const payload: Omit<CustomerApi, "id"> = {
        name: state.name.trim(),
        address: state.address.trim(),
        street: state.street.trim() || undefined,
        phone: state.phone.trim() || undefined,
        defaultPricePence,
        startDate: state.startDate,
        frequencyWeeks: Math.round(freq),
        active: state.active,
      };

      if (mode === "new") {
        await createCustomer(payload);
      } else {
        await updateCustomer(customer!.id, payload);
      }

      router.replace("/customers");
      router.refresh();
    } catch {
      setError("Could not save. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    if (!customer) return;
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
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="grid gap-3">
        <Field label="Name">
          <input
            value={state.name}
            onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
            className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          />
        </Field>

        <Field label="Address">
          <input
            value={state.address}
            onChange={(e) => setState((s) => ({ ...s, address: e.target.value }))}
            className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          />
        </Field>

        <Field label="Street/Area (optional)">
          <input
            value={state.street}
            onChange={(e) => setState((s) => ({ ...s, street: e.target.value }))}
            placeholder="e.g. Oak Road"
            className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <input
              value={state.phone}
              onChange={(e) => setState((s) => ({ ...s, phone: e.target.value }))}
              inputMode="tel"
              className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            />
          </Field>
          <Field label="Price (£)">
            <input
              value={state.defaultPricePounds}
              onChange={(e) =>
                setState((s) => ({ ...s, defaultPricePounds: e.target.value }))
              }
              inputMode="decimal"
              className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <input
              type="date"
              value={state.startDate}
              onChange={(e) => setState((s) => ({ ...s, startDate: e.target.value }))}
              className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            />
          </Field>

          <Field label="Frequency">
            <select
              value={String(state.frequencyWeeks)}
              onChange={(e) => {
                const v = e.target.value;
                setState((s) => ({
                  ...s,
                  frequencyWeeks: v === "custom" ? "custom" : Number(v),
                }));
              }}
              className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            >
              {presetFrequencies.map((n) => (
                <option key={n} value={String(n)}>
                  Every {n} week{n === 1 ? "" : "s"}
                </option>
              ))}
              <option value="custom">Custom…</option>
            </select>
          </Field>
        </div>

        {state.frequencyWeeks === "custom" ? (
          <Field label="Custom frequency (weeks)">
            <input
              value={state.customFrequencyWeeks}
              onChange={(e) =>
                setState((s) => ({ ...s, customFrequencyWeeks: e.target.value }))
              }
              inputMode="numeric"
              className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            />
          </Field>
        ) : null}

        <label className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Active
          </span>
          <input
            type="checkbox"
            checked={state.active}
            onChange={(e) => setState((s) => ({ ...s, active: e.target.checked }))}
            className="h-5 w-5"
          />
        </label>

        {error ? (
          <p className="text-sm font-medium text-red-600 dark:text-red-500">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => void onSave()}
          disabled={pending}
          className="h-12 rounded-xl bg-zinc-900 text-base font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? "Saving…" : "Save"}
        </button>

        {mode === "edit" ? (
          <button
            type="button"
            onClick={() => void onDelete()}
            disabled={pending}
            className="h-12 rounded-xl border border-red-200 bg-white text-base font-semibold text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-40 dark:border-red-900/50 dark:bg-zinc-950 dark:text-red-300 dark:hover:bg-red-950/30"
          >
            Delete customer
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
        {label}
      </span>
      {children}
    </label>
  );
}

