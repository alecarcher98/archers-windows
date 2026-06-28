import { PhoneMockup } from "./PhoneMockup";
import { RevealOnScroll } from "./RevealOnScroll";

function StatusPill({
  tone,
  children,
}: {
  tone: "due" | "paid" | "skipped";
  children: React.ReactNode;
}) {
  const styles = {
    due: "bg-amber-100 text-amber-800",
    paid: "bg-emerald-100 text-emerald-800",
    skipped: "bg-zinc-100 text-zinc-500",
  } as const;
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles[tone]}`}>{children}</span>;
}

function JobRow({
  name,
  detail,
  tone,
  label,
}: {
  name: string;
  detail: string;
  tone: "due" | "paid" | "skipped";
  label: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5">
      <div>
        <p className="text-sm font-semibold text-zinc-900">{name}</p>
        <p className="text-xs text-zinc-500">{detail}</p>
      </div>
      <StatusPill tone={tone}>{label}</StatusPill>
    </div>
  );
}

export function WhatItDoes() {
  return (
    <section id="what-it-does" className="bg-zinc-50 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <RevealOnScroll>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Your round, at a glance</h2>
            <p className="mt-3 text-zinc-600">
              Everything a round needs and nothing it doesn&rsquo;t — who&rsquo;s due, who&rsquo;s
              paid, and the notes that actually matter.
            </p>
          </div>
        </RevealOnScroll>

        <div className="mt-12 grid gap-10 sm:grid-cols-3">
          <RevealOnScroll>
            <PhoneMockup label="Today's run, sorted by street">
              <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                Tuesday · 6 jobs
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <JobRow name="Mrs Johnson" detail="Oak Avenue · 8-weekly" tone="paid" label="Paid" />
                <JobRow name="Mr Patel" detail="Oak Avenue · 4-weekly" tone="due" label="Due" />
                <JobRow name="The Greens" detail="Birch Close · 8-weekly" tone="skipped" label="Skipped – rain" />
              </div>
              <button className="mt-4 w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white">
                Mark street done
              </button>
            </PhoneMockup>
          </RevealOnScroll>

          <RevealOnScroll delay={100}>
            <PhoneMockup label="Notes that matter, right on the job">
              <p className="text-sm font-semibold text-zinc-900">Mrs Johnson</p>
              <p className="text-xs text-zinc-500">Oak Avenue · 8-weekly · Paid</p>
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-semibold text-amber-800">Gate code</p>
                <p className="mt-1 text-sm text-amber-900">
                  Side gate 4471 — dog is friendly, leave gate as found.
                </p>
              </div>
              <div className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                <p className="text-xs font-semibold text-zinc-600">Last visit</p>
                <p className="mt-1 text-sm text-zinc-700">Skipped — rain. Rebooked for next Tuesday.</p>
              </div>
            </PhoneMockup>
          </RevealOnScroll>

          <RevealOnScroll delay={200}>
            <PhoneMockup label="Who owes you, one tap to chase">
              <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                Payment reminders · 2
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <JobRow name="Mr Patel" detail="£18 · 4-weekly" tone="due" label="Due" />
                <JobRow name="Mrs Carter" detail="£24 · 8-weekly" tone="due" label="Due" />
              </div>
              <button className="mt-4 w-full rounded-xl bg-[var(--brand)] py-2.5 text-sm font-semibold text-white">
                Send reminder texts
              </button>
              <p className="mt-2 text-center text-[11px] text-zinc-400">
                GoCardless mandates carry over — they do nothing.
              </p>
            </PhoneMockup>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
