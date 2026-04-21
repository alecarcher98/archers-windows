import { AppHeader } from "@/components/AppHeader";
import { EarningsClient } from "@/components/EarningsClient";
import { formatDisplayDate, formatDisplayDateRange } from "@/lib/formatDate";
import { sumEarnings, weekRangeFor } from "@/lib/earnings";
import { isoToday } from "@/lib/schedule";

export const dynamic = "force-dynamic";

function formatMoneyPounds(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

export default async function EarningsPage() {
  const today = isoToday();
  const todaySum = await sumEarnings(today, today);
  const week = weekRangeFor(today);
  const weekSum = await sumEarnings(week.start, week.end);

  return (
    <>
      <AppHeader title="Earnings" />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <div className="grid gap-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Today ({formatDisplayDate(today)})
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {formatMoneyPounds(todaySum.totalPence)}
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Expected {formatMoneyPounds(todaySum.expectedPence)}
              {todaySum.expectedPence > todaySum.totalPence
                ? ` · ${formatMoneyPounds(todaySum.expectedPence - todaySum.totalPence)} outstanding`
                : ""}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Cash {formatMoneyPounds(todaySum.cashPence)} · Bank {formatMoneyPounds(todaySum.bankPence)}{" "}
              · Card {formatMoneyPounds(todaySum.cardPence)}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              This week ({formatDisplayDateRange(week.start, week.end)})
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {formatMoneyPounds(weekSum.totalPence)}
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Round {formatMoneyPounds(weekSum.scheduledPence)} · One-offs{" "}
              {formatMoneyPounds(weekSum.oneOffPence)}
            </p>
            {weekSum.days.length ? (
              <ul className="mt-3 space-y-1">
                {weekSum.days.map((d) => (
                  <li
                    key={d.date}
                    className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400"
                  >
                    <span>{formatDisplayDate(d.date)}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {formatMoneyPounds(d.collectedPence)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <EarningsClient />
        </div>
      </main>
    </>
  );
}
