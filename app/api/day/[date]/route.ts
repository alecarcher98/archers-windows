import { NextResponse } from "next/server";
import { emptyDay, getDay, putDay } from "@/lib/kv";
import {
  isIsoDate,
  parsePricePence,
  type DayRecord,
  type DayJobState,
  type OneOffJob,
} from "@/lib/models";

function okDate(date: string) {
  return isIsoDate(date);
}

export async function GET(_: Request, ctx: { params: Promise<{ date: string }> }) {
  const { date } = await ctx.params;
  if (!okDate(date)) {
    return NextResponse.json({ ok: false, error: "Invalid date" }, { status: 400 });
  }
  const record = await getDay(date);
  return NextResponse.json({ ok: true, day: record });
}

type PatchBody = Partial<{
  orderedJobIds: string[];
  jobState: Record<string, Partial<DayJobState>>;
  addOneOff: Partial<OneOffJob>;
  deleteOneOffId: string;
}>;

export async function PATCH(req: Request, ctx: { params: Promise<{ date: string }> }) {
  const { date } = await ctx.params;
  if (!okDate(date)) {
    return NextResponse.json({ ok: false, error: "Invalid date" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as PatchBody | null;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });

  const existing = await getDay(date);
  const next: DayRecord = { ...existing, date };

  if (Array.isArray(body.orderedJobIds)) {
    next.orderedJobIds = body.orderedJobIds.filter((x) => typeof x === "string");
  }

  if (body.jobState && typeof body.jobState === "object") {
    for (const [jobId, patch] of Object.entries(body.jobState)) {
      if (!jobId || typeof patch !== "object" || patch === null) continue;
      const prev = next.jobState[jobId] ?? {};
      next.jobState[jobId] = {
        cleaned: typeof patch.cleaned === "boolean" ? patch.cleaned : prev.cleaned,
        collected: typeof patch.collected === "boolean" ? patch.collected : prev.collected,
        // accept legacy fields too (if old client submits them)
        completed: typeof patch.completed === "boolean" ? patch.completed : prev.completed,
        cashCollected:
          typeof patch.cashCollected === "boolean" ? patch.cashCollected : prev.cashCollected,
        visitNote: typeof patch.visitNote === "string" ? patch.visitNote : prev.visitNote,
      };
    }
  }

  if (body.addOneOff && typeof body.addOneOff === "object") {
    const name = typeof body.addOneOff.name === "string" ? body.addOneOff.name.trim() : "";
    const address =
      typeof body.addOneOff.address === "string" ? body.addOneOff.address.trim() : "";
    const phone = typeof body.addOneOff.phone === "string" ? body.addOneOff.phone.trim() : "";
    const pricePence = parsePricePence(body.addOneOff.pricePence);
    if (!name || !address || pricePence === null) {
      return NextResponse.json({ ok: false, error: "Invalid one-off" }, { status: 400 });
    }
    const id = `oneoff:${crypto.randomUUID()}`;
    const one: OneOffJob = {
      id,
      name,
      address,
      phone: phone.length ? phone : undefined,
      pricePence,
    };
    next.oneOff = { ...next.oneOff, [id]: one };
    if (!next.orderedJobIds.includes(id)) next.orderedJobIds = [...next.orderedJobIds, id];
  }

  if (typeof body.deleteOneOffId === "string" && body.deleteOneOffId.startsWith("oneoff:")) {
    const id = body.deleteOneOffId;
    if (next.oneOff[id]) {
      const oneOffNext = { ...next.oneOff };
      delete oneOffNext[id];
      next.oneOff = oneOffNext;
      next.orderedJobIds = next.orderedJobIds.filter((x) => x !== id);
      const stateNext = { ...next.jobState };
      delete stateNext[id];
      next.jobState = stateNext;
    }
  }

  // If record is empty, we can avoid writes, but keeping it simple here.
  // Ensure day always has a stable shape.
  const stable =
    next.orderedJobIds.length === 0 &&
    Object.keys(next.jobState).length === 0 &&
    Object.keys(next.oneOff).length === 0
      ? emptyDay(date)
      : next;
  await putDay(stable);
  return NextResponse.json({ ok: true, day: stable });
}

