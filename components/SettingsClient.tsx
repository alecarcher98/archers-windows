"use client";

import { useEffect, useMemo, useState } from "react";
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
      <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-zinc-900">Business</p>
        <label className="mt-3 block">
          <span className="text-sm font-medium text-zinc-700">Display name</span>
          <input
            value={state.businessName}
            onChange={(e) => setState((s) => ({ ...s, businessName: e.target.value }))}
            className="mt-1 h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
          />
        </label>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-zinc-900">Thank-you message</p>
        <p className="mt-1 text-sm text-zinc-600">
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
          className="mt-3 min-h-[120px] w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
        />
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Preview</p>
        <pre className="mt-1 whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800">
          {preview}
        </pre>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <label className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Compact run mode</p>
            <p className="mt-0.5 text-sm text-zinc-600">
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

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      {saved ? <p className="text-sm font-medium text-emerald-700">Saved.</p> : null}

      <button
        type="button"
        onClick={() => void onSave()}
        disabled={pending}
        className="h-12 rounded-full bg-[var(--brand)] text-base font-semibold text-white shadow-sm hover:bg-[var(--brand-dark)] disabled:opacity-40"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>

      <LoginCredentialsSection />
    </div>
  );
}

function LoginCredentialsSection() {
  const [username, setUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/auth/credentials")
      .then((r) => r.json())
      .then((j: { ok?: boolean; username?: string }) => {
        if (j.ok && j.username) {
          setUsername(j.username);
          setNewUsername(j.username);
        }
      })
      .catch(() => null);
  }, []);

  async function onSave() {
    setError(null);
    setSaved(false);
    setPending(true);
    try {
      const res = await fetch("/api/auth/credentials", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newUsername, newPassword }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; username?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.error ?? `Could not update login (${res.status}).`);
      }
      setUsername(json.username ?? newUsername);
      setCurrentPassword("");
      setNewPassword("");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update login.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-zinc-900">Login</p>
      <p className="mt-1 text-sm text-zinc-600">
        Shared login for this app, stored in the database. Default is{" "}
        <span className="font-semibold">archer</span> / <span className="font-semibold">archer</span>{" "}
        until changed.
      </p>

      <div className="mt-3 grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm font-medium text-zinc-900">Username</span>
          <input
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder={username || "archer"}
            className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-medium text-zinc-900">Current password</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-medium text-zinc-900">New password</span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
          />
        </label>
      </div>

      {error ? <p className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
      {saved ? <p className="mt-3 text-sm font-medium text-emerald-700">Login updated.</p> : null}

      <button
        type="button"
        onClick={() => void onSave()}
        disabled={pending || !newUsername.trim() || !currentPassword || !newPassword}
        className="mt-3 h-12 w-full rounded-full bg-zinc-900 text-base font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-40"
      >
        {pending ? "Updating…" : "Update login"}
      </button>
    </section>
  );
}
