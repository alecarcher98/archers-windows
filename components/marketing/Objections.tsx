import { RevealOnScroll } from "./RevealOnScroll";

const OBJECTIONS = [
  {
    q: "I'm not techy.",
    a: "That's the point — I do the setup. You send me your list, you get an app with one login. No spreadsheets, no fiddling with settings.",
  },
  {
    q: "Can I keep my GoCardless?",
    a: "Yes. Your existing GoCardless mandates carry over — they do nothing on your end. Your customers keep paying the same way.",
  },
  {
    q: "I'm already on Squeegee or Cleaner Planner.",
    a: "Fair enough — they do a lot. Get Round Mate does less on purpose: just the round, who's due, who's paid. If that's all you need, it's simpler and cheaper.",
  },
  {
    q: "What about my data?",
    a: "It's yours. You can export it any time, and it's never sold or shared. If you ever want to leave, you take your customer list with you.",
  },
];

export function Objections() {
  return (
    <section className="bg-zinc-50 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <RevealOnScroll>
          <h2 className="text-center text-2xl font-bold text-zinc-900 sm:text-3xl">
            Before you ask
          </h2>
        </RevealOnScroll>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {OBJECTIONS.map((item, i) => (
            <RevealOnScroll key={item.q} delay={i * 80}>
              <div className="h-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-zinc-900">{item.q}</p>
                <p className="mt-2 text-sm text-zinc-600">{item.a}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
