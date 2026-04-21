import type { PaymentType } from "@/lib/models";
import type { ListedJob } from "@/lib/schedule";

export type DayJobVM = {
  jobId: string;
  kind: "scheduled" | "oneoff";
  title: string;
  subtitle: string;
  street?: string;
  phone?: string;
  pricePence: number;
  cleaned: boolean;
  collected: boolean;
  visitNote: string;
  smsSentAt?: number;
  paymentType?: PaymentType;
  skipped?: boolean;
  isFirstVisit?: boolean;
  customerNotes?: string;
  deletable?: boolean;
};

export function listedJobToVm(j: ListedJob): DayJobVM {
  return {
    jobId: j.jobId,
    kind: j.kind,
    title: j.kind === "scheduled" ? j.customer.name : j.oneOff.name,
    subtitle: j.kind === "scheduled" ? j.customer.address : j.oneOff.address,
    street: j.kind === "scheduled" ? j.customer.street : undefined,
    phone: j.kind === "scheduled" ? j.customer.phone : j.oneOff.phone,
    pricePence: j.pricePence,
    cleaned: j.cleaned,
    collected: j.collected,
    visitNote: j.visitNote,
    smsSentAt: j.smsSentAt,
    paymentType: j.paymentType,
    skipped: j.skipped,
    isFirstVisit: j.isFirstVisit,
    customerNotes: j.customerNotes,
    deletable: j.kind === "oneoff",
  };
}
