import { NextResponse } from "next/server";
import { getRemoved, listRemovedJobIds, removeFromWeek, restoreRemoved } from "@/lib/kv";
import { isIsoDate } from "@/lib/models";

export async function GET() {
  const ids = await listRemovedJobIds();
  const records = await Promise.all(ids.map((id) => getRemoved(id)));
  return NextResponse.json({
    ok: true,
    removed: records.filter(Boolean),
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { jobId?: unknown; dueDate?: unknown; note?: unknown }
    | null;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });

  const jobId = typeof body.jobId === "string" ? body.jobId : "";
  const dueDate = typeof body.dueDate === "string" ? body.dueDate : "";
  const note = typeof body.note === "string" ? body.note : undefined;

  if (!jobId || !isIsoDate(dueDate)) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  await removeFromWeek(jobId, dueDate, note);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const body = (await req.json().catch(() => null)) as { jobId?: unknown } | null;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  const jobId = typeof body.jobId === "string" ? body.jobId : "";
  if (!jobId) return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  await restoreRemoved(jobId);
  return NextResponse.json({ ok: true });
}

