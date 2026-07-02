import Link from "next/link";
import { whatsAppLink } from "@/lib/marketingConfig";
import { PhoneMockup } from "./PhoneMockup";
import { RevealOnScroll } from "./RevealOnScroll";

function StatusPill({
  tone,
  children,
}: {
  tone: "due" | "paid";
  children: React.ReactNode;
}) {
  const styles = {
    due: "bg-amber-100 text-amber-800",
    paid: "bg-emerald-100 text-emerald-800",
  } as const;
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles[tone]}`}>{children}</span>;
}

export function Hero() {
  return (
    <section className="px-4 pt-12 pb-16 sm:px-6 sm:pt-20">
      <div className="mx-auto max-w-5xl">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <RevealOnScroll>
              <p className="inline-flex items-center rounded-full bg-[var(--brand-tint)] px-3 py-1 text-sm font-semibold text-[var(--brand-dark)]">
                Built for real cleaning rounds, not boardrooms
              </p>
            </RevealOnScroll>
            <RevealOnScroll delay={80}>
              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
                Run your round from one app, not a stack of spreadsheets.{" "}
                <span className="block text-[var(--brand)]">
                  I&rsquo;ll set it up for you — live in 24 hours.
                </span>
              </h1>
            </RevealOnScroll>
            <RevealOnScroll delay={160}>
              <p className="mt-5 text-lg text-zinc-600 sm:text-xl">
                Who&rsquo;s due, who&rsquo;s paid, gate codes, skipped cleans — your whole round on
                your phone. No spreadsheets, no hassle, one login.
              </p>
            </RevealOnScroll>
            <RevealOnScroll delay={240}>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <a
                  href={whatsAppLink("Hi — I'd like to get my round set up for £99")}
                  target="_blank"
                  rel="noopener"
                  className="w-full rounded-full bg-[var(--brand)] px-7 py-4 text-base font-semibold text-white shadow-md transition hover:bg-[var(--brand-dark)] sm:w-auto"
                >
                  Get your round set up — £99
                </a>
                <Link
                  href="/demo"
                  className="w-full rounded-full border border-zinc-300 px-7 py-4 text-base font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50 sm:w-auto"
                >
                  Try the live demo
                </Link>
              </div>
            </RevealOnScroll>
          </div>

          <RevealOnScroll delay={120} className="flex justify-center">
            <PhoneMockup label="Wednesday's run, sorted by street">
              <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                Wednesday · 5 jobs
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Mr Davies</p>
                    <p className="text-xs text-zinc-500">Birch Close · 8-weekly</p>
                  </div>
                  <StatusPill tone="paid">Paid</StatusPill>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Mrs Allen</p>
                    <p className="text-xs text-zinc-500">Birch Close · 4-weekly</p>
                  </div>
                  <StatusPill tone="due">Due</StatusPill>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">The Greens</p>
                    <p className="text-xs text-zinc-500">Birch Close · 4-weekly</p>
                  </div>
                  <StatusPill tone="due">Due</StatusPill>
                </div>
              </div>
              <button className="mt-4 w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white">
                Mark street done
              </button>
            </PhoneMockup>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
