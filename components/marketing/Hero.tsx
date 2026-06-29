import Image from "next/image";
import Link from "next/link";
import { STRIPE_PAYMENT_LINK_URL } from "@/lib/marketingConfig";
import { RevealOnScroll } from "./RevealOnScroll";

export function Hero() {
  return (
    <section className="px-4 pt-12 pb-16 sm:px-6 sm:pt-20">
      <div className="mx-auto max-w-3xl text-center">
        <RevealOnScroll>
          <Image
            src="/marketing/logo.png"
            alt="RoundMate — your round, simplified"
            width={820}
            height={210}
            priority
            unoptimized
            className="mx-auto h-auto w-full max-w-sm sm:max-w-md"
          />
        </RevealOnScroll>
        <RevealOnScroll delay={40}>
          <p className="mt-6 inline-flex items-center rounded-full bg-[var(--brand-tint)] px-3 py-1 text-sm font-semibold text-[var(--brand-dark)]">
            Built for real rounds, not boardrooms
          </p>
        </RevealOnScroll>
        <RevealOnScroll delay={80}>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
            Run your round from one app, not a stack of spreadsheets.
            <span className="block text-[var(--brand)]">I&rsquo;ll set it up for you — live in 24 hours.</span>
          </h1>
        </RevealOnScroll>
        <RevealOnScroll delay={160}>
          <p className="mt-5 text-lg text-zinc-600 sm:text-xl">
            Who&rsquo;s due, who&rsquo;s paid, gate codes, skipped cleans — your whole round on
            your phone. No spreadsheets, no faff, one login.
          </p>
        </RevealOnScroll>
        <RevealOnScroll delay={240}>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href={STRIPE_PAYMENT_LINK_URL}
              className="w-full rounded-full bg-[var(--brand)] px-7 py-4 text-base font-semibold text-white shadow-md transition hover:bg-[var(--brand-dark)] sm:w-auto"
            >
              Get your round set up — £99
            </a>
            <Link
              href="/marketing/demo"
              className="w-full rounded-full border border-zinc-300 px-7 py-4 text-base font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50 sm:w-auto"
            >
              See it live
            </Link>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
