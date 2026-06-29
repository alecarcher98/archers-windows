"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Customer } from "@/lib/models";
import type { Company } from "@/lib/tenant";
import { parseCustomerCsv, type ParsedCustomerDraft } from "@/lib/csvImport";

function formatMoneyPounds(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

export function AdminCompanyManager({
  company,
  initialCustomers,
}: {
  company: Company;
  initialCustomers: Customer[];
}) {
  const [customers, setCustomers] = useState(initialCustomers);

  return (
    <div className="flex flex-col gap-4">
      <CompanyDetailsSection company={company} />
      <CsvImportSection companyId={company.id} />
      <CustomerListSection
        companyId={company.id}
        customers={customers}
        onChange={setCustomers}
      />
      <DangerZoneSection company={company} />
    </div>
  );
}

function CompanyDetailsSection({ company }: { company: Company }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(company.displayName);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onSave() {
    setPending(true);
    setSaved(false);
    try {
      await fetch(`/api/admin/companies/${company.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      setSaved(true);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Company name
            </span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 h-11 w-full max-w-sm rounded-xl border border-zinc-200 bg-white px-3 text-base font-semibold text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
            />
          </label>
          <p className="mt-2 text-sm text-zinc-500">
            /c/{company.slug} ·{" "}
            <a
              href={`/c/${company.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              open
            </a>
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={pending}
          className="h-10 shrink-0 rounded-full bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-40"
        >
          {pending ? "Saving…" : saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}

function CsvImportSection({ companyId }: { companyId: string }) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<ParsedCustomerDraft[]>([]);
  const [unmatchedHeaders, setUnmatchedHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function onParse() {
    const parsed = parseCustomerCsv(text);
    setRows(parsed.rows);
    setUnmatchedHeaders(parsed.unmatchedHeaders);
    setResult(null);
  }

  function updateRow(index: number, patch: Partial<ParsedCustomerDraft>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function onImport() {
    setImporting(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/customers`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ customers: rows }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        created?: number;
        errors?: string[];
        error?: string;
      };
      if (!res.ok || !json.ok) {
        setResult(json.error ?? "Import failed");
        return;
      }
      setResult(
        `Imported ${json.created ?? 0} customer${json.created === 1 ? "" : "s"}.` +
          (json.errors?.length ? ` ${json.errors.length} row(s) skipped.` : ""),
      );
      setRows([]);
      setText("");
      window.location.reload();
    } catch {
      setResult("Import failed. Try again.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-zinc-900">Import customer list</p>
      <p className="mt-0.5 text-xs text-zinc-600">
        Paste a CSV (or anything comma/tab-separated) — messy headers are fine, it'll guess. Check
        the preview before importing.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={"name,address,price,frequency,notes\nJane Smith,12 Oak Rd,18,4 weekly,Gate code 1234"}
        className="mt-3 min-h-[120px] w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
      />

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onParse}
          disabled={!text.trim()}
          className="h-10 rounded-full bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-40"
        >
          Preview
        </button>
        {rows.length ? (
          <button
            type="button"
            onClick={() => void onImport()}
            disabled={importing}
            className="h-10 rounded-full bg-[var(--brand)] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-dark)] disabled:opacity-40"
          >
            {importing ? "Importing…" : `Import ${rows.length} customer${rows.length === 1 ? "" : "s"}`}
          </button>
        ) : null}
      </div>

      {unmatchedHeaders.length ? (
        <p className="mt-2 text-xs text-amber-700">
          Didn&rsquo;t recognise: {unmatchedHeaders.join(", ")} — ignored.
        </p>
      ) : null}
      {result ? <p className="mt-2 text-sm font-medium text-zinc-700">{result}</p> : null}

      {rows.length ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="text-zinc-500">
                <th className="px-2 py-1">Name</th>
                <th className="px-2 py-1">Address</th>
                <th className="px-2 py-1">Street</th>
                <th className="px-2 py-1">Phone</th>
                <th className="px-2 py-1">£</th>
                <th className="px-2 py-1">Start</th>
                <th className="px-2 py-1">Weeks</th>
                <th className="px-2 py-1">Notes</th>
                <th className="px-2 py-1" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={row.issues.length ? "bg-amber-50" : ""}>
                  <td className="p-1">
                    <input
                      value={row.name}
                      onChange={(e) => updateRow(i, { name: e.target.value })}
                      className="h-8 w-32 rounded border border-zinc-200 px-1.5"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      value={row.address}
                      onChange={(e) => updateRow(i, { address: e.target.value })}
                      className="h-8 w-40 rounded border border-zinc-200 px-1.5"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      value={row.street}
                      onChange={(e) => updateRow(i, { street: e.target.value })}
                      className="h-8 w-24 rounded border border-zinc-200 px-1.5"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      value={row.phone}
                      onChange={(e) => updateRow(i, { phone: e.target.value })}
                      className="h-8 w-28 rounded border border-zinc-200 px-1.5"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      value={row.pricePounds}
                      onChange={(e) => updateRow(i, { pricePounds: e.target.value })}
                      className="h-8 w-16 rounded border border-zinc-200 px-1.5"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="date"
                      value={row.startDate}
                      onChange={(e) => updateRow(i, { startDate: e.target.value })}
                      className="h-8 w-28 rounded border border-zinc-200 px-1.5"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      value={row.frequencyWeeks}
                      onChange={(e) => updateRow(i, { frequencyWeeks: e.target.value })}
                      disabled={row.oneOff}
                      className="h-8 w-14 rounded border border-zinc-200 px-1.5 disabled:opacity-40"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      value={row.notes}
                      onChange={(e) => updateRow(i, { notes: e.target.value })}
                      className="h-8 w-32 rounded border border-zinc-200 px-1.5"
                    />
                  </td>
                  <td className="p-1">
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="h-8 rounded border border-red-200 px-2 text-red-700"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.some((r) => r.issues.length) ? (
            <ul className="mt-2 list-inside list-disc text-xs text-amber-800">
              {rows
                .map((r, i) => (r.issues.length ? `Row ${i + 1}: ${r.issues.join(", ")}` : null))
                .filter(Boolean)
                .map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CustomerListSection({
  companyId,
  customers,
  onChange,
}: {
  companyId: string;
  customers: Customer[];
  onChange: (customers: Customer[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  async function onDelete(id: string) {
    await fetch(`/api/admin/companies/${companyId}/customers/${id}`, { method: "DELETE" });
    onChange(customers.filter((c) => c.id !== id));
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-4 py-3">
        <p className="text-sm font-semibold text-zinc-900">
          Customers ({customers.length})
        </p>
      </div>
      {customers.length === 0 ? (
        <p className="px-4 py-6 text-sm text-zinc-600">No customers yet — import a list above.</p>
      ) : (
        <ul className="divide-y divide-zinc-200">
          {customers.map((c) => (
            <li key={c.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">{c.name}</p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {c.address} · {formatMoneyPounds(c.defaultPricePence)} ·{" "}
                    {c.oneOff ? "One-off" : `Every ${c.frequencyWeeks}w`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(editingId === c.id ? null : c.id)}
                    className="h-8 rounded-full border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50"
                  >
                    {editingId === c.id ? "Close" : "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete(c.id)}
                    className="h-8 rounded-full border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 shadow-sm hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {editingId === c.id ? (
                <EditCustomerForm
                  companyId={companyId}
                  customer={c}
                  onSaved={(updated) => {
                    onChange(customers.map((x) => (x.id === updated.id ? updated : x)));
                    setEditingId(null);
                  }}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EditCustomerForm({
  companyId,
  customer,
  onSaved,
}: {
  companyId: string;
  customer: Customer;
  onSaved: (customer: Customer) => void;
}) {
  const [name, setName] = useState(customer.name);
  const [address, setAddress] = useState(customer.address);
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [pricePounds, setPricePounds] = useState((customer.defaultPricePence / 100).toFixed(2));
  const [notes, setNotes] = useState(customer.notes ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/customers/${customer.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          phone,
          defaultPricePence: Math.round(Number(pricePounds.replaceAll(",", ".")) * 100),
          startDate: customer.startDate,
          frequencyWeeks: customer.frequencyWeeks,
          oneOff: customer.oneOff,
          notes,
          active: customer.active,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; customer?: Customer };
      if (!res.ok || !json.ok || !json.customer) {
        setError(json.error ?? "Could not save");
        return;
      }
      onSaved(json.customer);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3 grid gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className="h-9 rounded border border-zinc-200 px-2 text-sm"
      />
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Address"
        className="h-9 rounded border border-zinc-200 px-2 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
          className="h-9 rounded border border-zinc-200 px-2 text-sm"
        />
        <input
          value={pricePounds}
          onChange={(e) => setPricePounds(e.target.value)}
          placeholder="Price (£)"
          className="h-9 rounded border border-zinc-200 px-2 text-sm"
        />
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes"
        rows={2}
        className="rounded border border-zinc-200 px-2 py-1 text-sm"
      />
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={() => void onSave()}
        disabled={pending}
        className="h-9 rounded-full bg-zinc-900 text-sm font-semibold text-white disabled:opacity-40"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

function DangerZoneSection({ company }: { company: Company }) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText.trim() === company.slug;

  async function onDelete() {
    if (!canDelete) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/companies/${company.id}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmSlug: confirmText.trim() }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not delete company");
        return;
      }
      router.push("/admin");
    } catch {
      setError("Could not delete company. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-4 shadow-sm">
      <p className="text-sm font-semibold text-red-900">Delete company</p>
      <p className="mt-1 text-sm text-red-800">
        Permanently deletes <span className="font-semibold">{company.displayName}</span> and every
        customer, schedule and login that belongs to them. This cannot be undone.
      </p>
      <label className="mt-3 grid gap-1">
        <span className="text-xs font-medium text-red-900">
          Type <span className="font-mono">{company.slug}</span> to confirm
        </span>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="h-11 rounded-xl border border-red-300 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none focus:border-red-500"
        />
      </label>
      {error ? <p className="mt-2 text-sm font-medium text-red-700">{error}</p> : null}
      <button
        type="button"
        onClick={() => void onDelete()}
        disabled={!canDelete || pending}
        className="mt-3 h-11 rounded-full bg-red-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-red-800 disabled:opacity-40"
      >
        {pending ? "Deleting…" : "Permanently delete company"}
      </button>
    </div>
  );
}
