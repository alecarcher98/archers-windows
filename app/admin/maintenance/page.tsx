import { getDatabaseHealth } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const health = await getDatabaseHealth();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-zinc-900">Maintenance</h1>

      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-zinc-900">Database storage</p>

        {!health ? (
          <p className="mt-2 text-sm text-zinc-500">
            No database connected — running on local storage.
          </p>
        ) : (
          <>
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <p className="text-2xl font-extrabold text-zinc-900">{health.usedPretty}</p>
              <p className="text-sm text-zinc-500">of {health.limitPretty}</p>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-[var(--brand)]"
                style={{ width: `${health.percentUsed}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-zinc-500">
              {health.percentUsed.toFixed(1)}% used
            </p>

            {health.tables.length > 0 ? (
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Largest tables
                </p>
                <ul className="mt-2 flex flex-col divide-y divide-zinc-100">
                  {health.tables.map((t) => (
                    <li key={t.name} className="flex items-center justify-between gap-3 py-2">
                      <span className="truncate text-sm text-zinc-700">{t.name}</span>
                      <span className="shrink-0 text-sm text-zinc-500">{t.pretty}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
