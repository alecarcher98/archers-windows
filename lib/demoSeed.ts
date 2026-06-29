import type { AppSettings, Customer, DayRecord, IsoDate } from "@/lib/models";
import { addDays, defaultJobIdForCustomer } from "@/lib/schedule";

export const DEMO_BUSINESS_NAME = "Cleaning Co";

export const DEMO_SETTINGS: AppSettings = {
  businessName: DEMO_BUSINESS_NAME,
  smsTemplate: `Good {{greeting}},
Your windows have been cleaned on {{todayDate}} for the value of {{houseValue}}
Thanks,
{{businessName}}`,
  compactMode: false,
};

type SeedCustomer = {
  id: string;
  name: string;
  address: string;
  street: string;
  phone?: string;
  pricePence: number;
  frequencyWeeks: number;
  notes?: string;
  /** Days from today this customer's cycle is offset by — 0 means due today. */
  dueOffsetDays?: number;
  active?: boolean;
  pausedInDays?: number;
};

const SEED: SeedCustomer[] = [
  {
    id: "demo-1",
    name: "Mrs Johnson",
    address: "12 Oak Avenue",
    street: "Oak Avenue",
    phone: "07700 111222",
    pricePence: 1800,
    frequencyWeeks: 4,
    notes: "Side gate code 4471 — dog is friendly, leave gate as found.",
  },
  {
    id: "demo-2",
    name: "Mr Patel",
    address: "14 Oak Avenue",
    street: "Oak Avenue",
    phone: "07700 111223",
    pricePence: 1800,
    frequencyWeeks: 4,
  },
  {
    id: "demo-3",
    name: "Mrs Carter",
    address: "16 Oak Avenue",
    street: "Oak Avenue",
    pricePence: 2000,
    frequencyWeeks: 4,
  },
  {
    id: "demo-4",
    name: "The Greens",
    address: "3 Birch Close",
    street: "Birch Close",
    phone: "07700 111224",
    pricePence: 2400,
    frequencyWeeks: 8,
  },
  {
    id: "demo-5",
    name: "Mr Davies",
    address: "5 Birch Close",
    street: "Birch Close",
    phone: "07700 111225",
    pricePence: 2200,
    frequencyWeeks: 8,
  },
  {
    id: "demo-6",
    name: "Ms Wright",
    address: "8 Maple Drive",
    street: "Maple Drive",
    phone: "07700 111226",
    pricePence: 1600,
    frequencyWeeks: 4,
    notes: "Keys under the mat — let yourself into the back garden.",
  },
  {
    id: "demo-7",
    name: "Mr Hughes",
    address: "10 Maple Drive",
    street: "Maple Drive",
    phone: "07700 111227",
    pricePence: 1600,
    frequencyWeeks: 4,
  },
  {
    id: "demo-8",
    name: "Mrs Allen",
    address: "22 Elm Street",
    street: "Elm Street",
    phone: "07700 111228",
    pricePence: 1500,
    frequencyWeeks: 8,
  },
  {
    id: "demo-9",
    name: "Mrs Iqbal",
    address: "18 Oak Avenue",
    street: "Oak Avenue",
    phone: "07700 111229",
    pricePence: 1800,
    frequencyWeeks: 4,
    dueOffsetDays: 5,
  },
  {
    id: "demo-10",
    name: "Mr Owen",
    address: "9 Birch Close",
    street: "Birch Close",
    phone: "07700 111230",
    pricePence: 2200,
    frequencyWeeks: 4,
    dueOffsetDays: 10,
  },
  {
    id: "demo-11",
    name: "Mr Lawson",
    address: "2 Maple Drive",
    street: "Maple Drive",
    phone: "07700 111231",
    pricePence: 1800,
    frequencyWeeks: 4,
    active: false,
  },
  {
    id: "demo-12",
    name: "Mrs Bennett",
    address: "30 Elm Street",
    street: "Elm Street",
    phone: "07700 111232",
    pricePence: 1500,
    frequencyWeeks: 8,
    pausedInDays: 14,
  },
];

/** Already-cleaned-and-collected on load, so the demo isn't a totally blank list. */
const PRESET_DONE: Record<string, "cash" | "card"> = {
  "demo-1": "cash",
  "demo-4": "card",
};

export function createDemoCustomers(today: IsoDate): Customer[] {
  return SEED.map((s) => {
    const periodDays = 7 * s.frequencyWeeks;
    const offset = s.dueOffsetDays ?? 0;
    const startDate = addDays(today, -periodDays + offset);
    return {
      id: s.id,
      name: s.name,
      address: s.address,
      street: s.street,
      phone: s.phone,
      defaultPricePence: s.pricePence,
      startDate,
      frequencyWeeks: s.frequencyWeeks,
      active: s.active ?? true,
      notes: s.notes,
      pausedUntil: s.pausedInDays ? addDays(today, s.pausedInDays) : undefined,
    };
  });
}

export function createDemoDay(today: IsoDate): DayRecord {
  const jobState: DayRecord["jobState"] = {};
  for (const [customerId, paymentType] of Object.entries(PRESET_DONE)) {
    jobState[defaultJobIdForCustomer(customerId)] = {
      cleaned: true,
      collected: true,
      paymentType,
    };
  }
  return { date: today, orderedJobIds: [], jobState, oneOff: {} };
}
