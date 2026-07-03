import { NextResponse } from "next/server";
import { getUsername, setCredentials } from "@/lib/credentials";
import { getCompanyById } from "@/lib/admin";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const existing = await getCompanyById(id);
    if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const username = await getUsername(id);
    return NextResponse.json({ ok: true, username });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load login details";
    console.error("[admin company credentials GET]", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// Admin override: resets a company's login without needing their current
// password — the admin session (checked centrally in proxy.ts) is the
// authorization for this, not knowledge of the old credentials.
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const existing = await getCompanyById(id);
    if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const body = (await req.json().catch(() => null)) as {
      username?: unknown;
      password?: unknown;
    } | null;
    if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });

    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!username || !password) {
      return NextResponse.json(
        { ok: false, error: "Username and password are required" },
        { status: 400 },
      );
    }

    await setCredentials(id, username, password);
    return NextResponse.json({ ok: true, username });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to reset login";
    console.error("[admin company credentials PATCH]", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
