import { NextResponse } from "next/server";
import { getUsername, setCredentials, verifyCredentials } from "@/lib/credentials";

export async function GET() {
  try {
    const username = await getUsername();
    return NextResponse.json({ ok: true, username });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load login details";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      currentPassword?: unknown;
      newUsername?: unknown;
      newPassword?: unknown;
    } | null;
    if (!body) {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const currentPassword =
      typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newUsername = typeof body.newUsername === "string" ? body.newUsername.trim() : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!newUsername || !newPassword) {
      return NextResponse.json(
        { ok: false, error: "Username and new password are required" },
        { status: 400 },
      );
    }

    const currentUsername = await getUsername();
    if (!(await verifyCredentials(currentUsername, currentPassword))) {
      return NextResponse.json(
        { ok: false, error: "Current password is incorrect" },
        { status: 401 },
      );
    }

    await setCredentials(newUsername, newPassword);
    return NextResponse.json({ ok: true, username: newUsername });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update login details";
    console.error("[credentials PATCH]", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
