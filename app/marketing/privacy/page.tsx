import type { Metadata } from "next";
import { whatsAppLink } from "@/lib/marketingConfig";

export const metadata: Metadata = {
  title: "Privacy Policy & Data Protection — RoundMate",
  description:
    "How RoundMate handles your data and your customers' data, in line with UK GDPR and the Data Protection Act.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-zinc-200 py-6 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-zinc-600">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold text-[var(--brand-dark)]">Legal</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
          Privacy Policy &amp; Data Protection
        </h1>
        <p className="mt-3 text-sm text-zinc-500">Last updated 30 June 2026</p>

        <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <Section title="Introduction">
            <p>
              RoundMate (&ldquo;we&rdquo;, &ldquo;our&rdquo;) is committed to protecting the
              privacy of our users. This policy outlines how we handle your data and your
              customers&rsquo; data.
            </p>
          </Section>

          <Section title="Data Controller">
            <p>RoundMate, managed by Alec Archer, United Kingdom.</p>
          </Section>

          <Section title="Information We Collect">
            <p>
              When you sign up, you provide your business contact details. During the setup
              phase, you provide your customer list (names, addresses, schedules, notes,
              prices).
            </p>
          </Section>

          <Section title="How We Use Data">
            <p>
              Solely to build, host, and maintain your private RoundMate application instance.
              We never sell, share, or analyse your customer data for external marketing.
            </p>
          </Section>

          <Section title="Data Retention">
            <p>
              Your data is yours. If you cancel your hosting/support, your data remains
              accessible to you. If you request account deletion, all data is permanently
              wiped from our databases within 30 days.
            </p>
          </Section>

          <Section title="Security">
            <p>
              Data is encrypted in transit and at rest using standard cloud infrastructure best
              practices.
            </p>
          </Section>

          <Section title="Your Rights">
            <p>
              Under UK GDPR, you have the right to access, rectify, or erase your personal
              data. Contact us directly via our public WhatsApp link to exercise these rights.
            </p>
            <a
              href={whatsAppLink("Hi — I have a question about my data on RoundMate")}
              target="_blank"
              rel="noopener"
              className="inline-flex w-fit items-center rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-dark)]"
            >
              Contact us on WhatsApp
            </a>
          </Section>
        </div>
      </div>
    </div>
  );
}
