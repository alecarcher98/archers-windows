import { getCustomersByIds, getDay, listCustomerIds } from "@/lib/kv";
import type { Customer, IsoDate, PaymentType } from "@/lib/models";
import { addDays, isoToUtcNoon, utcNoonToIso } from "@/lib/schedule";

export type DayEarningsBreakdown = {
  date: IsoDate;
  expectedPence: number;
  collectedPence: number;
  cashPence: number;
  bankPence: number;
  cardPence: number;
  scheduledPence: number;
  oneOffPence: number;
};

export type EarningsResult = {
  totalPence: number;
  cashPence: number;
  bankPence: number;
  cardPence: number;
  expectedPence: number;
  scheduledPence: number;
  oneOffPence: number;
  days: DayEarningsBreakdown[];
};

function startOfWeekMonday(date: IsoDate) {
  const dt = isoToUtcNoon(date);
  const dow = dt.getUTCDay();
  const diff = (dow + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - diff);
  return utcNoonToIso(dt);
}

export function weekRangeFor(date: IsoDate) {
  const start = startOfWeekMonday(date);
  const end = addDays(start, 6);
  return { start, end };
}

function jobPrice(
  jobId: string,
  day: Awaited<ReturnType<typeof getDay>>,
  byId: Map<string, Customer>,
) {
  if (jobId.startsWith("cust:")) {
    const c = byId.get(jobId.slice("cust:".length));
    return c?.defaultPricePence ?? 0;
  }
  if (jobId.startsWith("oneoff:")) {
    return day.oneOff?.[jobId]?.pricePence ?? 0;
  }
  return 0;
}

function paymentBucket(
  collected: boolean,
  paymentType: PaymentType | undefined,
): PaymentType | "none" {
  if (!collected) return "none";
  if (paymentType === "bank" || paymentType === "card" || paymentType === "cash") return paymentType;
  return "cash";
}

export async function sumEarnings(start: IsoDate, end: IsoDate): Promise<EarningsResult> {
  const startT = isoToUtcNoon(start).getTime();
  const endT = isoToUtcNoon(end).getTime();
  if (endT < startT) {
    return {
      totalPence: 0,
      cashPence: 0,
      bankPence: 0,
      cardPence: 0,
      expectedPence: 0,
      scheduledPence: 0,
      oneOffPence: 0,
      days: [],
    };
  }

  const ids = await listCustomerIds();
  const customers = await getCustomersByIds(ids);
  const byId = new Map<string, Customer>(customers.map((c) => [c.id, c]));

  const days: DayEarningsBreakdown[] = [];
  let totalPence = 0;
  let cashPence = 0;
  let bankPence = 0;
  let cardPence = 0;
  let expectedPence = 0;
  let scheduledPence = 0;
  let oneOffPence = 0;

  for (let t = startT; t <= endT; t += 86_400_000) {
    const date = utcNoonToIso(new Date(t));
    const day = await getDay(date);
    let dayExpected = 0;
    let dayCollected = 0;
    let dayCash = 0;
    let dayBank = 0;
    let dayCard = 0;
    let dayScheduled = 0;
    let dayOneOff = 0;

    const jobIds = new Set<string>([
      ...day.orderedJobIds,
      ...Object.keys(day.oneOff ?? {}),
    ]);

    for (const jobId of jobIds) {
      const price = jobPrice(jobId, day, byId);
      if (!price) continue;
      dayExpected += price;

      const st = day.jobState?.[jobId];
      const collected =
        typeof st?.collected === "boolean" ? st.collected : Boolean(st?.cashCollected);
      const bucket = paymentBucket(collected, st?.paymentType);

      if (collected) {
        dayCollected += price;
        if (bucket === "cash") dayCash += price;
        else if (bucket === "bank") dayBank += price;
        else if (bucket === "card") dayCard += price;
        else dayCash += price;

        if (jobId.startsWith("oneoff:")) dayOneOff += price;
        else dayScheduled += price;
      }
    }

    if (dayExpected || dayCollected) {
      days.push({
        date,
        expectedPence: dayExpected,
        collectedPence: dayCollected,
        cashPence: dayCash,
        bankPence: dayBank,
        cardPence: dayCard,
        scheduledPence: dayScheduled,
        oneOffPence: dayOneOff,
      });
    }

    expectedPence += dayExpected;
    totalPence += dayCollected;
    cashPence += dayCash;
    bankPence += dayBank;
    cardPence += dayCard;
    scheduledPence += dayScheduled;
    oneOffPence += dayOneOff;
  }

  return {
    totalPence,
    cashPence,
    bankPence,
    cardPence,
    expectedPence,
    scheduledPence,
    oneOffPence,
    days,
  };
}

/** @deprecated use sumEarnings */
export async function sumCashCollected(start: IsoDate, end: IsoDate) {
  const r = await sumEarnings(start, end);
  return {
    totalPence: r.cashPence,
    days: r.days.map((d) => ({ date: d.date, totalPence: d.cashPence })),
  };
}

export function earningsToCsv(result: EarningsResult) {
  const lines = [
    "date,expected_gbp,collected_gbp,cash_gbp,bank_gbp,card_gbp,scheduled_gbp,oneoff_gbp",
  ];
  for (const d of result.days) {
    const gbp = (p: number) => (p / 100).toFixed(2);
    lines.push(
      `${d.date},${gbp(d.expectedPence)},${gbp(d.collectedPence)},${gbp(d.cashPence)},${gbp(d.bankPence)},${gbp(d.cardPence)},${gbp(d.scheduledPence)},${gbp(d.oneOffPence)}`,
    );
  }
  lines.push(
    `TOTAL,${(result.expectedPence / 100).toFixed(2)},${(result.totalPence / 100).toFixed(2)},${(result.cashPence / 100).toFixed(2)},${(result.bankPence / 100).toFixed(2)},${(result.cardPence / 100).toFixed(2)},${(result.scheduledPence / 100).toFixed(2)},${(result.oneOffPence / 100).toFixed(2)}`,
  );
  return lines.join("\n");
}
