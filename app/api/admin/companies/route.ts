import { NextResponse } from "next/server";
import { createCompany, slugExists, slugify, validateSlug } from "@/lib/admin";
import { setCredentials } from "@/lib/credentials";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      displayName?: unknown;
      slug?: unknown;
      username?: unknown;
      password?: unknown;
      brandColor?: unknown;
    } | null;
    if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });

    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
    const slugInput = typeof body.slug === "string" ? body.slug.trim() : "";
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const brandColor = typeof body.brandColor === "string" ? body.brandColor.trim() : "";

    if (!displayName) {
      return NextResponse.json({ ok: false, error: "Company name is required" }, { status: 400 });
    }
    if (!username || !password) {
      return NextResponse.json(
        { ok: false, error: "Login username and password are required" },
        { status: 400 },
      );
    }

    const slug = slugify(slugInput || displayName);
    const slugError = validateSlug(slug);
    if (slugError) {
      return NextResponse.json({ ok: false, error: slugError }, { status: 400 });
    }
    if (await slugExists(slug)) {
      return NextResponse.json(
        { ok: false, error: `"${slug}" is already taken` },
        { status: 409 },
      );
    }

    const companyId = crypto.randomUUID();
    const company = await createCompany({
      id: companyId,
      displayName,
      slug,
      brandColor: brandColor || undefined,
    });
    await setCredentials(companyId, username, password);

    return NextResponse.json({ ok: true, company }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create company";
    console.error("[admin companies POST]", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
