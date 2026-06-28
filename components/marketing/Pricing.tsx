import { STRIPE_PAYMENT_LINK_URL } from "@/lib/marketingConfig";
import { RevealOnScroll } from "./RevealOnScroll";

const INCLUDED = [
  "Your customer list entered and checked",
  "Rounds, streets and 4/8-weekly schedules set up",
  "Prices and notes added for every job",
  "One login, ready to use on your phone",
];

export function Pricing() {
  return (
    <section id="pricing" className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <RevealOnScroll>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Simple, one-off pricing</h2>
            <p className="mt-3 text-zinc-600">No contract. No surprise invoices.</p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={100}>
          <div className="mt-8 rounded-3xl border-2 border-[var(--brand)] bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold tracking-wide text-[var(--brand-dark)] uppercase">
              Founder setup — limited spots
            </p>
            <p className="mt-3 text-5xl font-extrabold text-zinc-900">
              £99
              <span className="text-base font-medium text-zinc-500"> one-off</span>
            </p>
            <ul className="mt-6 flex flex-col gap-2 text-left text-sm text-zinc-700">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 text-[var(--brand)]">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <a
              href={STRIPE_PAYMENT_LINK_URL}
              className="mt-7 block w-full rounded-full bg-[var(--brand)] px-7 py-4 text-base font-semibold text-white shadow-md transition hover:bg-[var(--brand-dark)]"
            >
              Get your round set up — £99
            </a>
            <p className="mt-4 text-xs text-zinc-500">
              Optional ongoing hosting &amp; support: £15/month. Cancel any time — your data stays
              yours either way.
            </p>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
