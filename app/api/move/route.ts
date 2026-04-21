import { NextResponse } from "next/server";
import { clearMove, setMove } from "@/lib/kv";
import { isIsoDate } from "@/lib/models";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { jobId?: unknown; fromDate?: unknown; toDate?: unknown }
    | null;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });

  const jobId = typeof body.jobId === "string" ? body.jobId : "";
  const fromDate = typeof body.fromDate === "string" ? body.fromDate : "";
  const toDate = typeof body.toDate === "string" ? body.toDate : "";

  if (!jobId || !isIsoDate(fromDate) || !isIsoDate(toDate)) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  if (fromDate === toDate) {
    await clearMove(jobId);
    return NextResponse.json({ ok: true });
  }

  await setMove(jobId, fromDate, toDate);
  return NextResponse.json({ ok: true });
}

