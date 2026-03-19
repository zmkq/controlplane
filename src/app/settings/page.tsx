import { getAppSettings } from '@/lib/settings';
import { getApplicationHealth } from '@/lib/ops-health';
import { SettingsClient } from '@/components/settings/settings-client';

export default async function SettingsPage() {
  const [settings, health] = await Promise.all([
    getAppSettings(),
    getApplicationHealth(),
  ]);

  return (
    <div className="space-y-6 px-4 pb-32 pt-4 sm:px-6 xl:px-10">
      <SettingsClient initialSettings={settings} operationsHealth={health} />
    </div>
  );
}
