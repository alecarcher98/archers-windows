"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppSettings } from "@/lib/models";
import { buildCustomerMessage } from "@/lib/messageTemplate";

export function SettingsClient({ initial }: { initial: AppSettings }) {
  const router = useRouter();
  const [state, setState] = useState({
    ...initial,
    compactMode: initial.compactMode ?? false,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const preview = useMemo(
    () =>
      buildCustomerMessage(
        state,
        new Date().toISOString().slice(0, 10),
        1200,
        "Sample Customer",
        "1 Example Street",
        "07123456789",
      ),
    [state],
  );

  async function patchSettings(body: Partial<AppSettings>) {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { ok?: boolean; error?: string; settings?: AppSettings };
    if (!res.ok || !json.ok) {
      throw new Error(json.error ?? `Could not save settings (${res.status}).`);
    }
    if (json.settings) {
      setState({
        ...json.settings,
        compactMode: json.settings.compactMode ?? false,
      });
    }
    router.refresh();
    return json.settings;
  }

  async function onSave() {
    setError(null);
    setSaved(false);
    setPending(true);
    try {
      await patchSettings(state);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setPending(false);
    }
  }

  async function onCompactModeChange(compactMode: boolean) {
    setState((s) => ({ ...s, compactMode }));
    setError(null);
    setSaved(false);
    setPending(true);
    try {
      await patchSettings({ compactMode });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save compact mode.");
      setState((s) => ({ ...s, compactMode: !compactMode }));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Business</p>
        <label className="mt-3 block">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Display name</span>
          <input
            value={state.businessName}
            onChange={(e) => setState((s) => ({ ...s, businessName: e.target.value }))}
            className="mt-1 h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Thank-you message</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Shown on the day view for jobs marked <span className="font-semibold">Cleaned</span> and{" "}
          <span className="font-semibold">Collected</span>. Copy per customer, then tick off in the
          list. Placeholders:{" "}
          <code className="text-xs">{"{{greeting}}"}</code> (Morning/Afternoon/Evening),{" "}
          <code className="text-xs">{"{{todayDate}}"}</code>,{" "}
          <code className="text-xs">{"{{houseValue}}"}</code>,{" "}
          <code className="text-xs">{"{{businessName}}"}</code>,{" "}
          <code className="text-xs">{"{{phone}}"}</code>.
        </p>
        <textarea
          value={state.smsTemplate}
          onChange={(e) => setState((s) => ({ ...s, smsTemplate: e.target.value }))}
          rows={6}
          className="mt-3 min-h-[120px] w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
        />
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Preview</p>
        <pre className="mt-1 whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          {preview}
        </pre>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <label className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Compact run mode</p>
            <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
              Larger Done button for one-handed use in the van.
            </p>
          </div>
          <input
            type="checkbox"
            checked={Boolean(state.compactMode)}
            onChange={(e) => void onCompactModeChange(e.target.checked)}
            className="h-5 w-5"
          />
        </label>
      </section>

      {error ? (
        <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      {saved ? (
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Saved.</p>
      ) : null}

      <button
        type="button"
        onClick={() => void onSave()}
        disabled={pending}
        className="h-12 rounded-xl bg-zinc-900 text-base font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}
