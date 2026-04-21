import { NextResponse } from "next/server";
import { buildWeekSummary } from "@/lib/weekSummary";
import { isIsoDate } from "@/lib/models";
import { isoToday } from "@/lib/schedule";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? isoToday();
  if (!isIsoDate(date)) {
    return NextResponse.json({ ok: false, error: "Invalid date" }, { status: 400 });
  }
  const summary = await buildWeekSummary(date);
  return NextResponse.json({ ok: true, summary });
}
