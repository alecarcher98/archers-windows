import Link from "next/link";

export function AppHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/today"
          className="min-w-0 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          <span className="truncate">{title}</span>
        </Link>
        <div className="flex items-center gap-2">{right}</div>
      </div>
    </header>
  );
}

