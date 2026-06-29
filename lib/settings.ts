import type { AppSettings } from "@/lib/models";
import { DEFAULT_APP_SETTINGS } from "@/lib/models";
import { localKv } from "@/lib/localKv";
import { ensureSchema, isPostgresEnabled } from "@/lib/db";
import { getCurrentCompanyId } from "@/lib/tenant";

function settingsKey(companyId: string) {
  return `app:settings:${companyId}`;
}

type KvLike = {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<unknown>;
};

function hasRemoteKvEnv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

const kv: KvLike = hasRemoteKvEnv()
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require("@vercel/kv").kv as KvLike)
  : (localKv as unknown as KvLike);

const LEGACY_SMS_TEMPLATE =
  "Hi {customerName}, we've cleaned your windows today. Thank you! — {businessName}";

function normalizeSettings(raw: Partial<AppSettings> | null): AppSettings {
  const businessName =
    typeof raw?.businessName === "string" && raw.businessName.trim()
      ? raw.businessName.trim()
      : DEFAULT_APP_SETTINGS.businessName;
  let smsTemplate =
    typeof raw?.smsTemplate === "string" && raw.smsTemplate.trim()
      ? raw.smsTemplate.trim()
      : DEFAULT_APP_SETTINGS.smsTemplate;
  if (smsTemplate === LEGACY_SMS_TEMPLATE) {
    smsTemplate = DEFAULT_APP_SETTINGS.smsTemplate;
  }
  const compactMode =
    typeof raw?.compactMode === "boolean"
      ? raw.compactMode
      : (DEFAULT_APP_SETTINGS.compactMode ?? false);
  return { businessName, smsTemplate, compactMode };
}

export async function getAppSettings(): Promise<AppSettings> {
  const companyId = await getCurrentCompanyId();
  if (isPostgresEnabled()) {
    await ensureSchema();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { sql } = require("@vercel/postgres") as typeof import("@vercel/postgres");
    const res = await sql`
      select value from app_settings where company_id = ${companyId}::uuid and id = 'default' limit 1
    `;
    const row = res.rows[0] as { value: unknown } | undefined;
    if (!row?.value || typeof row.value !== "object") return DEFAULT_APP_SETTINGS;
    return normalizeSettings(row.value as Partial<AppSettings>);
  }
  const raw = (await kv.get(settingsKey(companyId))) as Partial<AppSettings> | null;
  return normalizeSettings(raw);
}

export async function putAppSettings(settings: AppSettings): Promise<AppSettings> {
  const companyId = await getCurrentCompanyId();
  const next = normalizeSettings({
    ...settings,
    compactMode: settings.compactMode ?? false,
  });

  if (isPostgresEnabled()) {
    await ensureSchema();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { sql } = require("@vercel/postgres") as typeof import("@vercel/postgres");
    // NOTE: `app_settings` PK is still just (id) until the Stage 5 migration
    // changes it to (company_id, id) — safe for now because only one tenant
    // exists; do not ship a second tenant before then.
    await sql`
      insert into app_settings (id, company_id, value)
      values ('default', ${companyId}::uuid, ${next as never})
      on conflict (id) do update set value = excluded.value
      where app_settings.company_id = ${companyId}::uuid
    `;
    return next;
  }

  await kv.set(settingsKey(companyId), next);
  return next;
}
