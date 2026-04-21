import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { ReviewClient } from "@/components/ReviewClient";

export const dynamic = "force-dynamic";

export default function ReviewPage() {
  return (
    <>
      <AppHeader
        title="Review"
        right={
          <Link
            href="/week"
            className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Week
          </Link>
        }
      />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <ReviewClient />
      </main>
    </>
  );
}

