import { RevealOnScroll } from "./RevealOnScroll";

const STEPS = [
  {
    title: "Send me your customer list",
    body: "Whatever you've got — a spreadsheet, a notebook photo, an export from another system. However it lives now is fine.",
  },
  {
    title: "I set everything up in 24 hours",
    body: "Rounds, 4/8-weekly schedules, prices, notes — all entered and checked before you see it.",
  },
  {
    title: "You open the app and your whole round's there",
    body: "One login. Today's jobs, who's due, who's paid. That's it.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <RevealOnScroll>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Done-for-you, start to finish</h2>
            <p className="mt-3 text-zinc-600">You don&rsquo;t set this up. I do.</p>
          </div>
        </RevealOnScroll>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <RevealOnScroll key={step.title} delay={i * 100}>
              <div className="h-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-base font-semibold text-zinc-900">{step.title}</h3>
                <p className="mt-2 text-sm text-zinc-600">{step.body}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
