import { NextResponse } from "next/server";
import { DEFAULT_APP_SETTINGS } from "@/lib/models";
import { getAppSettings, putAppSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await getAppSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load settings";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      businessName?: unknown;
      smsTemplate?: unknown;
      compactMode?: unknown;
    } | null;
    if (!body) {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const existing = await getAppSettings();
    const businessName =
      typeof body.businessName === "string" ? body.businessName : existing.businessName;
    const smsTemplate =
      typeof body.smsTemplate === "string" ? body.smsTemplate : existing.smsTemplate;
    const compactMode =
      typeof body.compactMode === "boolean"
        ? body.compactMode
        : (existing.compactMode ?? false);

    if (!businessName.trim()) {
      return NextResponse.json({ ok: false, error: "Business name required" }, { status: 400 });
    }
    if (!smsTemplate.trim()) {
      return NextResponse.json({ ok: false, error: "Message template required" }, { status: 400 });
    }

    const settings = await putAppSettings({
      businessName: businessName.trim(),
      smsTemplate: smsTemplate.trim(),
      compactMode,
    });
    return NextResponse.json({ ok: true, settings: settings ?? DEFAULT_APP_SETTINGS });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save settings";
    console.error("[settings PATCH]", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
