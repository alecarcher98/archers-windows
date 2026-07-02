"use client";

import { useCallback, useState } from "react";
import type { DayJobVM } from "@/components/DayJobsClient";
import { TodayTabsClient } from "@/components/TodayTabsClient";
import type { OverdueVM } from "@/components/OverdueClient";
import { DayStrip } from "@/components/DayStrip";
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
  initialTab,
}: {
  date: string;
  jobs: DayJobVM[];
  order: string[];
  overdue: OverdueVM[];
  weekDays: { date: IsoDate; count: number }[];
  settings: AppSettings;
  initialTab: ScheduleTab;
}) {
  const [tab, setTabState] = useState<ScheduleTab>(initialTab);

  // Switching tabs is purely a client-side state change — every job, week,
  // and overdue prop is already on the client. Routing through next/navigation
  // would re-fetch this (force-dynamic) page's RSC payload over the network
  // on every tap, which stalls the whole switch on slow or flaky connections.
  // history.replaceState keeps the URL bookmarkable/shareable without that.
  const setTab = useCallback((next: ScheduleTab) => {
    setTabState(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(window.history.state, "", url);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <DayStrip days={weekDays} activeDate={date} />

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
