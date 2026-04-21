import { NextResponse } from "next/server";
import { getDay, putDay } from "@/lib/kv";
import { isIsoDate } from "@/lib/models";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { sourceDate?: unknown; jobId?: unknown }
    | null;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });

  const sourceDate = typeof body.sourceDate === "string" ? body.sourceDate : "";
  const jobId = typeof body.jobId === "string" ? body.jobId : "";
  if (!isIsoDate(sourceDate) || !jobId) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const day = await getDay(sourceDate);
  const prev = day.jobState[jobId] ?? {};
  day.jobState[jobId] = {
    ...prev,
    collected: true,
    // keep legacy fields aligned too
    cashCollected: true,
  };

  await putDay(day);
  return NextResponse.json({ ok: true });
}

