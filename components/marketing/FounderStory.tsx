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
              Hi, I&rsquo;m Alec. My parents run Archer&rsquo;s Windows — a real cleaning
              round. They were running it off a paper book and a memory for who&rsquo;d paid, so
              I built them an app for it.
            </p>
            <p className="mt-3 text-lg text-zinc-700">
              It worked. So now I set the same thing up for other cleaners — done for you,
              live on your phone in 24 hours.
            </p>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
