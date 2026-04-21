import { AppHeader } from "@/components/AppHeader";
import { SettingsClient } from "@/components/SettingsClient";
import { getAppSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getAppSettings();

  return (
    <>
      <AppHeader title="Settings" />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">
        <SettingsClient initial={settings} />
      </main>
    </>
  );
}
