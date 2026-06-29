"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { DayJobVM } from "@/components/DayJobsClient";
import { TodayTabsClient } from "@/components/TodayTabsClient";
import type { OverdueVM } from "@/components/OverdueClient";
import { ScheduleWeekPanel } from "@/components/ScheduleWeekPanel";
import { WeekSummaryPanel } from "@/components/WeekSummaryPanel";
import { ScheduleMorePanel } from "@/components/ScheduleMorePanel";
import type { AppSettings } from "@/lib/models";
import type { IsoDate } from "@/lib/models";

export type ScheduleTab = "day" | "week" | "more";

function Segment({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-10 flex-1 rounded-lg text-sm font-semibold",
        active ? "bg-white text-[var(--brand-dark)] shadow-sm" : "text-zinc-600",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function ScheduleTabsClient({
  date,
  jobs,
  order,
  overdue,
  weekDays,
  settings,
}: {
  date: string;
  jobs: DayJobVM[];
  order: string[];
  overdue: OverdueVM[];
  weekDays: { date: IsoDate; count: number }[];
  settings: AppSettings;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tab = useMemo((): ScheduleTab => {
    const t = searchParams.get("tab");
    if (t === "week" || t === "more" || t === "day") return t;
    return "day";
  }, [searchParams]);

  const setTab = useCallback(
    (next: ScheduleTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", next);
      router.replace(`/schedule?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 rounded-xl border border-zinc-200 bg-zinc-50 p-1">
        <Segment active={tab === "day"} onClick={() => setTab("day")}>
          Day
        </Segment>
        <Segment active={tab === "week"} onClick={() => setTab("week")}>
          Week
        </Segment>
        <Segment active={tab === "more"} onClick={() => setTab("more")}>
          More
        </Segment>
      </div>

      {tab === "day" ? (
        <TodayTabsClient
          date={date}
          jobs={jobs}
          order={order}
          overdue={overdue}
          settings={settings}
        />
      ) : null}
      {tab === "week" ? (
        <div className="flex flex-col gap-3">
          <WeekSummaryPanel anchorDate={date} />
          <ScheduleWeekPanel days={weekDays} />
        </div>
      ) : null}
      {tab === "more" ? <ScheduleMorePanel /> : null}
    </div>
  );
}
