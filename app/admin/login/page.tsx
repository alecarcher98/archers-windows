"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginInner />
    </Suspense>
  );
}

function AdminLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => searchParams.get("next") || "/admin", [searchParams]);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const fd = new FormData(e.currentTarget);
    const secret = String(fd.get("secret") ?? "");

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      if (!res.ok) {
        setError("Incorrect secret.");
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Could not sign in. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-stretch justify-center bg-zinc-50 px-4 py-10">
      <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm">
        <p className="inline-flex items-center rounded-full bg-zinc-900 px-3 py-1 text-sm font-semibold text-white">
          Admin
        </p>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-zinc-900">
          Admin access
        </h1>
        <p className="mt-2 text-sm text-zinc-600">For setting up new companies only.</p>

        <form className="mt-6 flex flex-col gap-3" onSubmit={onSubmit}>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-900">Admin secret</span>
            <input
              name="secret"
              type="password"
              autoComplete="current-password"
              className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-zinc-400"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="mt-2 h-12 rounded-full bg-zinc-900 text-base font-semibold text-white shadow-md transition hover:bg-zinc-800 disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
          {error ? <p className="mt-1 text-sm font-medium text-red-600">{error}</p> : null}
        </form>
      </div>
    </main>
  );
}
