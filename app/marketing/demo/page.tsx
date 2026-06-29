import type { Metadata } from "next";
import { RevealOnScroll } from "@/components/marketing/RevealOnScroll";
import { DemoApp } from "@/components/demo/DemoApp";

export const metadata: Metadata = {
  title: "RoundMate demo — try it yourself",
  description:
    "A live, interactive sandbox with fake data for a fake business — try marking jobs done, chasing payments and adding a customer, right in your browser.",
};

export default function DemoPage() {
  return (
    <section className="px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <RevealOnScroll>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              Try it yourself
            </h1>
            <p className="mt-4 text-lg text-zinc-600">
              No video, no smoke and mirrors — this is the real app, loaded with fake data for a
              fake business. Mark jobs done, chase a payment, add a customer. Nothing here is
              saved or sent anywhere; refresh to start over.
            </p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={100}>
          <div className="mt-10">
            <DemoApp />
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
