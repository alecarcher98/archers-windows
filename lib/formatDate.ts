import type { IsoDate } from "@/lib/models";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** e.g. 1 → "1st", 21 → "21st", 3 → "3rd" */
export function ordinalDay(day: number) {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

/** ISO yyyy-mm-dd → "21st March 2026" */
export function formatDisplayDate(isoDate: string | IsoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const month = MONTHS[m - 1] ?? "";
  return `${ordinalDay(d)} ${month} ${y}`;
}

/** "21st March 2026 → 27th March 2026" */
export function formatDisplayDateRange(start: string, end: string) {
  if (start === end) return formatDisplayDate(start);
  return `${formatDisplayDate(start)} → ${formatDisplayDate(end)}`;
}
