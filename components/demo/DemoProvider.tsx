"use client";

import { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import type { Customer, DayJobState, DayRecord, IsoDate } from "@/lib/models";
import { assembleDayJobs, isoToday } from "@/lib/schedule";
import { listedJobToVm, type DayJobVM } from "@/lib/dayJobVm";
import { createDemoCustomers, createDemoDay } from "@/lib/demoSeed";

export type NewDemoCustomer = {
  name: string;
  address: string;
  street: string;
  phone: string;
  pricePence: number;
  frequencyWeeks: number;
};

type DemoContextValue = {
  ready: boolean;
  today: IsoDate | null;
  customers: Customer[];
  jobs: DayJobVM[];
  updateJobState: (jobId: string, patch: Partial<DayJobState>) => void;
  markStreetDone: (street: string) => void;
  addCustomer: (input: NewDemoCustomer) => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [today, setToday] = useState<IsoDate | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [day, setDay] = useState<DayRecord | null>(null);

  // Seed only after mount so the statically-prerendered HTML never bakes in
  // a build-time date that could mismatch the visitor's actual "today".
  useEffect(() => {
    const t = isoToday();
    setToday(t);
    setCustomers(createDemoCustomers(t));
    setDay(createDemoDay(t));
  }, []);

  const jobs = useMemo<DayJobVM[]>(() => {
    if (!today || !day) return [];
    const { jobs: listed } = assembleDayJobs({ date: today, customers, day });
    return listed.map(listedJobToVm);
  }, [today, day, customers]);

  const updateJobState = useCallback((jobId: string, patch: Partial<DayJobState>) => {
    setDay((prev) => {
      if (!prev) return prev;
      const existing = prev.jobState[jobId] ?? {};
      return {
        ...prev,
        jobState: { ...prev.jobState, [jobId]: { ...existing, ...patch } },
      };
    });
  }, []);

  const markStreetDone = useCallback(
    (street: string) => {
      setDay((prev) => {
        if (!prev) return prev;
        const targets = jobs.filter((j) => (j.street?.trim() || "Other") === street && !j.skipped);
        const nextJobState = { ...prev.jobState };
        for (const j of targets) {
          const existing = nextJobState[j.jobId] ?? {};
          nextJobState[j.jobId] = {
            ...existing,
            cleaned: true,
            collected: true,
            paymentType: existing.paymentType ?? "cash",
          };
        }
        return { ...prev, jobState: nextJobState };
      });
    },
    [jobs],
  );

  const addCustomer = useCallback(
    (input: NewDemoCustomer) => {
      if (!today) return;
      const id = `demo-new-${Date.now()}-${Math.round(Math.random() * 1000)}`;
      const customer: Customer = {
        id,
        name: input.name,
        address: input.address,
        street: input.street || undefined,
        phone: input.phone || undefined,
        defaultPricePence: input.pricePence,
        startDate: today,
        frequencyWeeks: input.frequencyWeeks,
        active: true,
      };
      // No need to touch orderedJobIds — assembleDayJobs sorts any job not
      // already in the order by street then name, which places this sensibly.
      setCustomers((prev) => [...prev, customer]);
    },
    [today],
  );

  const value: DemoContextValue = {
    ready: today !== null && day !== null,
    today,
    customers,
    jobs,
    updateJobState,
    markStreetDone,
    addCustomer,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
