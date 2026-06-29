import Link from "next/link";
import { HomeIcon } from "@/components/Icons";

export function AppHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 py-3">
        <Link
          href="/schedule"
          aria-label="Back to your schedule"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm hover:bg-zinc-50 hover:text-zinc-900"
        >
          <HomeIcon className="h-4 w-4" />
        </Link>
        <p className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-zinc-900">
          {title}
        </p>
        <div className="flex shrink-0 items-center gap-2">{right}</div>
      </div>
    </header>
  );
}
