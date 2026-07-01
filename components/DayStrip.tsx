import Link from "next/link";
import { formatWeekdayShort } from "@/lib/formatDate";
import type { IsoDate } from "@/lib/models";

export function DayStrip({
  days,
  activeDate,
}: {
  days: { date: IsoDate; count: number }[];
  activeDate: string;
}) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((d) => {
        const active = d.date === activeDate;
        const dayNumber = Number(d.date.slice(-2));
        return (
          <Link
            key={d.date}
            href={`/day/${d.date}`}
            aria-current={active ? "date" : undefined}
            className={[
              "flex flex-col items-center gap-0.5 rounded-xl border py-2 text-center transition-colors",
              active
                ? "border-[var(--brand)] bg-[var(--brand-tint)] text-[var(--brand-dark)]"
                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
            ].join(" ")}
          >
            <span className="text-[10px] font-medium uppercase tracking-wide">
              {formatWeekdayShort(d.date)}
            </span>
            <span className="text-sm font-bold">{dayNumber}</span>
            <span
              className={[
                "h-1.5 w-1.5 rounded-full",
                d.count ? (active ? "bg-[var(--brand)]" : "bg-zinc-400") : "bg-transparent",
              ].join(" ")}
            />
          </Link>
        );
      })}
    </div>
  );
}
