import Link from "next/link";
import { ARCHERS_WINDOWS_LIVE_URL } from "@/lib/marketingConfig";
import { RevealOnScroll } from "./RevealOnScroll";

export function FounderStory() {
  return (
    <section className="bg-zinc-50 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <RevealOnScroll>
          <div className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm sm:p-10">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-tint)] text-lg font-bold text-[var(--brand-dark)]">
                AA
              </div>
              <div>
                <p className="text-base font-semibold text-zinc-900">Alec Archer</p>
                <p className="text-sm text-zinc-500">Software engineer, based in the UK</p>
              </div>
            </div>

            <p className="mt-6 text-lg text-zinc-700">
              Hi, I&rsquo;m Alec. My parents run Archer&rsquo;s Windows — a real window cleaning
              round. They were running it off a paper book and a memory for who&rsquo;d paid, so
              I built them an app for it.
            </p>
            <p className="mt-3 text-lg text-zinc-700">
              It worked. So now I set the same thing up for other window cleaners — done for you,
              live on your phone in 24 hours.
            </p>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-900">
                This isn&rsquo;t a sales mockup — it&rsquo;s the actual business I built it for,
                running live, free forever for them.
              </p>
              <Link
                href={ARCHERS_WINDOWS_LIVE_URL}
                className="mt-2 inline-flex items-center text-sm font-semibold text-amber-900 underline"
              >
                See the real Archer&rsquo;s Windows login →
              </Link>
              <p className="mt-1 text-xs text-amber-800/80">
                It&rsquo;s their private app, so you&rsquo;ll land on a real login screen, not a
                public demo — that&rsquo;s the point.
              </p>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
