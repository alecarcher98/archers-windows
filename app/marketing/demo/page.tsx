import type { Metadata } from "next";
import {
  ARCHERS_WINDOWS_LIVE_URL,
  DEMO_VIDEO_EMBED_URL,
  STRIPE_PAYMENT_LINK_URL,
} from "@/lib/marketingConfig";
import { RevealOnScroll } from "@/components/marketing/RevealOnScroll";

export const metadata: Metadata = {
  title: "See RoundMate live — demo",
  description: "Watch the 60-second demo and try the real, live Archer's Windows round.",
};

function PlayIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export default function DemoPage() {
  const hasVideo = Boolean(DEMO_VIDEO_EMBED_URL) && DEMO_VIDEO_EMBED_URL !== "#";

  return (
    <section className="px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <RevealOnScroll>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              See it for yourself
            </h1>
            <p className="mt-4 text-lg text-zinc-600">
              No demo smoke and mirrors — watch the 60-second walkthrough, then go open the real,
              live round it runs on.
            </p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={100}>
          <div className="mt-10 aspect-video w-full overflow-hidden rounded-3xl bg-zinc-900 shadow-md">
            {hasVideo ? (
              <iframe
                src={DEMO_VIDEO_EMBED_URL}
                title="60-second demo"
                className="h-full w-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-400">
                <PlayIcon />
                <p className="text-sm">60-second demo video — drop your link in lib/marketingConfig.ts</p>
              </div>
            )}
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={200}>
          <div className="mt-10 rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm sm:p-10">
            <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl">
              Archer&rsquo;s Windows — the real round, running live
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-zinc-600">
              This is my parents&rsquo; actual business. Every job, every gate code, every
              payment — managed in this exact app, every week. It&rsquo;s free, live, and stays
              that way forever.
            </p>
            <a
              href={ARCHERS_WINDOWS_LIVE_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-zinc-900 px-7 py-4 text-base font-semibold text-white transition hover:bg-zinc-800"
            >
              Open Archer&rsquo;s Windows →
            </a>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={300}>
          <div className="mt-10 text-center">
            <a
              href={STRIPE_PAYMENT_LINK_URL}
              className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-7 py-4 text-base font-semibold text-white shadow-md transition hover:bg-[var(--brand-dark)]"
            >
              Get your round set up — £99
            </a>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
