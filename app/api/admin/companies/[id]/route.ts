import { NextResponse } from "next/server";
import { deleteCompanyCascade, getCompanyById, updateCompany } from "@/lib/admin";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const existing = await getCompanyById(id);
    if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const body = (await req.json().catch(() => null)) as {
      displayName?: unknown;
      brandColor?: unknown;
    } | null;
    if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });

    await updateCompany(id, {
      displayName: typeof body.displayName === "string" ? body.displayName : undefined,
      brandColor: typeof body.brandColor === "string" ? body.brandColor || null : undefined,
    });

    const updated = await getCompanyById(id);
    return NextResponse.json({ ok: true, company: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update company";
    console.error("[admin company PATCH]", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const existing = await getCompanyById(id);
    if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const body = (await req.json().catch(() => null)) as { confirmSlug?: unknown } | null;
    const confirmSlug = typeof body?.confirmSlug === "string" ? body.confirmSlug.trim() : "";
    if (confirmSlug !== existing.slug) {
      return NextResponse.json(
        { ok: false, error: "Slug confirmation doesn't match" },
        { status: 400 },
      );
    }

    await deleteCompanyCascade(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete company";
    console.error("[admin company DELETE]", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
