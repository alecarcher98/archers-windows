import { CONTACT_EMAIL, STRIPE_PAYMENT_LINK_URL, mailtoLink, whatsAppLink } from "@/lib/marketingConfig";
import { RevealOnScroll } from "./RevealOnScroll";

const FAQS = [
  {
    q: "How long does setup actually take?",
    a: "24 hours from when I have your customer list. Most rounds are smaller than people think to type out — it's quick.",
  },
  {
    q: "Do my customers need to download anything?",
    a: "No. Get Round Mate is for you, not your customers. They just keep getting cleaned and keep paying the same way they do now.",
  },
  {
    q: "What if I want to change something after setup?",
    a: "Message me on WhatsApp or email and I'll update it. Most changes take minutes.",
  },
  {
    q: "Is this just for window cleaners?",
    a: "It's built around rounds — window cleaning, gutter clearing, anything with repeat customers on a schedule. If that's you, it'll fit.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <RevealOnScroll>
          <h2 className="text-center text-2xl font-bold text-zinc-900 sm:text-3xl">
            Frequently asked
          </h2>
        </RevealOnScroll>

        <div className="mt-8 flex flex-col gap-3">
          {FAQS.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-zinc-200 bg-white p-5 open:shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-zinc-900">
                {item.q}
                <span className="ml-4 text-zinc-400 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-zinc-600">{item.a}</p>
            </details>
          ))}
        </div>

        <RevealOnScroll delay={100}>
          <div className="mt-14 rounded-3xl bg-zinc-900 p-8 text-center sm:p-12">
            <h3 className="text-2xl font-bold text-white sm:text-3xl">Ready to get your round sorted?</h3>
            <p className="mt-3 text-zinc-300">
              Send your list, get set up in 24 hours, open the app. That&rsquo;s it.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <a
                href={STRIPE_PAYMENT_LINK_URL}
                className="w-full rounded-full bg-[var(--brand)] px-7 py-4 text-base font-semibold text-white shadow-md transition hover:bg-[var(--brand-dark)] sm:w-auto"
              >
                Get your round set up — £99
              </a>
              <a
                href={whatsAppLink("Hi — I'd like to find out about Get Round Mate")}
                className="w-full rounded-full border border-zinc-700 px-7 py-4 text-base font-semibold text-white transition hover:border-zinc-500 sm:w-auto"
              >
                WhatsApp me
              </a>
            </div>
            <a
              href={mailtoLink("Get Round Mate enquiry")}
              className="mt-4 inline-block text-sm text-zinc-400 hover:text-zinc-200"
            >
              Or email {CONTACT_EMAIL}
            </a>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
