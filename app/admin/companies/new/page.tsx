"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function slugifyClient(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function NewCompanyPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [username, setUsername] = useState("archer");
  const [password, setPassword] = useState("");
  const [brandColor, setBrandColor] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveSlug = useMemo(
    () => (slugTouched ? slug : slugifyClient(displayName)),
    [slug, slugTouched, displayName],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          slug: effectiveSlug,
          username: username.trim(),
          password,
          brandColor: brandColor.trim(),
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; company?: { id: string } };
      if (!res.ok || !json.ok || !json.company) {
        setError(json.error ?? "Could not create company");
        return;
      }
      router.push(`/admin/companies/${json.company.id}`);
    } catch {
      setError("Could not create company. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-zinc-900">New company</h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-zinc-900">Company name</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Dave's Cleaning Services"
              className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
            />
          </label>

          <label className="mt-3 grid gap-1">
            <span className="text-sm font-medium text-zinc-900">URL slug</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">/c/</span>
              <input
                value={effectiveSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugifyClient(e.target.value));
                }}
                className="h-12 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
              />
            </div>
          </label>

          <label className="mt-3 grid gap-1">
            <span className="text-sm font-medium text-zinc-900">Brand colour (optional)</span>
            <input
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              placeholder="#c2410c"
              className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
            />
          </label>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">Their login</p>
          <p className="mt-0.5 text-xs text-zinc-600">
            What they&rsquo;ll use to sign in at /c/{effectiveSlug || "..."}.
          </p>
          <label className="mt-3 grid gap-1">
            <span className="text-sm font-medium text-zinc-900">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
            />
          </label>
          <label className="mt-3 grid gap-1">
            <span className="text-sm font-medium text-zinc-900">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="text"
              className="h-12 rounded-xl border border-zinc-200 bg-white px-3 text-base text-zinc-900 shadow-sm outline-none focus:border-[var(--brand)]"
            />
          </label>
        </div>

        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={pending || !displayName.trim() || !effectiveSlug || !username.trim() || !password}
          className="h-12 rounded-full bg-[var(--brand)] text-base font-semibold text-white shadow-md hover:bg-[var(--brand-dark)] disabled:opacity-40"
        >
          {pending ? "Creating…" : "Create company"}
        </button>
      </form>
    </div>
  );
}
