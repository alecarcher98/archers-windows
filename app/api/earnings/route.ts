import { NextResponse } from "next/server";
import { isIsoDate, type IsoDate } from "@/lib/models";
import { sumCashCollected } from "@/lib/earnings";
import { isoToUtcNoon } from "@/lib/schedule";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const start = url.searchParams.get("start") ?? "";
  const end = url.searchParams.get("end") ?? "";

  if (!isIsoDate(start) || !isIsoDate(end)) {
    return NextResponse.json({ ok: false, error: "Invalid dates" }, { status: 400 });
  }

  const startT = isoToUtcNoon(start as IsoDate).getTime();
  const endT = isoToUtcNoon(end as IsoDate).getTime();
  const days = Math.floor((endT - startT) / 86_400_000) + 1;
  if (!Number.isFinite(days) || days <= 0) {
    return NextResponse.json({ ok: false, error: "Invalid range" }, { status: 400 });
  }
  if (days > 60) {
    return NextResponse.json(
      { ok: false, error: "Range too large (max 60 days)" },
      { status: 400 },
    );
  }

  const result = await sumCashCollected(start as IsoDate, end as IsoDate);
  return NextResponse.json({ ok: true, ...result });
}

