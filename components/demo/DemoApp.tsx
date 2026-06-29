"use client";

import { useState } from "react";
import { STRIPE_PAYMENT_LINK_URL } from "@/lib/marketingConfig";
import { DEMO_BUSINESS_NAME } from "@/lib/demoSeed";
import { DemoProvider, useDemo } from "@/components/demo/DemoProvider";
import { DemoDayView } from "@/components/demo/DemoDayView";
import { DemoCustomersView } from "@/components/demo/DemoCustomersView";

type DemoTab = "schedule" | "customers";

export function DemoApp() {
  return (
    <DemoProvider>
      <DemoAppShell />
    </DemoProvider>
  );
}

function DemoAppShell() {
  const { ready } = useDemo();
  const [tab, setTab] = useState<DemoTab>("schedule");

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-lg font-bold text-zinc-900">{DEMO_BUSINESS_NAME}</p>
            <p className="text-xs text-zinc-500">Fake data — nothing leaves your browser.</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-[var(--brand-tint)] px-3 py-1 text-xs font-semibold text-[var(--brand-dark)]">
            Live demo
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 rounded-xl border border-zinc-200 bg-zinc-50 p-1">
          <button
            type="button"
            onClick={() => setTab("schedule")}
            className={[
              "h-10 rounded-lg text-sm font-semibold",
              tab === "schedule" ? "bg-white text-[var(--brand-dark)] shadow-sm" : "text-zinc-600",
            ].join(" ")}
          >
            Schedule
          </button>
          <button
            type="button"
            onClick={() => setTab("customers")}
            className={[
              "h-10 rounded-lg text-sm font-semibold",
              tab === "customers" ? "bg-white text-[var(--brand-dark)] shadow-sm" : "text-zinc-600",
            ].join(" ")}
          >
            Customers
          </button>
        </div>
      </div>

      <div className="mt-3">
        {!ready ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-zinc-600">Loading demo…</p>
          </div>
        ) : tab === "schedule" ? (
          <DemoDayView />
        ) : (
          <DemoCustomersView />
        )}
      </div>

      <div className="mt-4 rounded-3xl bg-zinc-900 p-5 text-center">
        <p className="text-sm font-semibold text-white">Like what you see?</p>
        <p className="mt-1 text-sm text-zinc-300">
          This is your round, set up and ready in 24 hours.
        </p>
        <a
          href={STRIPE_PAYMENT_LINK_URL}
          className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--brand-dark)]"
        >
          Get your round set up — £99
        </a>
      </div>
    </div>
  );
}
