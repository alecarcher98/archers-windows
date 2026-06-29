import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-8">
      <h1 className="text-xl font-bold text-zinc-900">You&apos;re offline</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Open the app while online once to cache today&apos;s schedule. Cached pages may still work.
      </p>
      <Link
        href="/schedule"
        className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[var(--brand)] px-4 text-sm font-semibold text-white"
      >
        Try Schedule
      </Link>
    </main>
  );
}
