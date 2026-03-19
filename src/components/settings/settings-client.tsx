'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppSettings } from '@prisma/client';
import { useTranslations } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/lib/toast';
import { updateSettings } from '@/app/settings/actions';
import { NotificationToggle } from '@/components/pwa/notification-toggle';
import { Loader2, Save } from 'lucide-react';
import { getDirection, LOCALE_COOKIE_NAME } from '@/lib/locale';

export function SettingsClient({ initialSettings }: { initialSettings: AppSettings }) {
  const { t } = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Local state for form inputs
  const [settings, setSettings] = useState({
    language: initialSettings.language ?? 'en',
    phoneFormat: initialSettings.phoneFormat ?? 'local',
    timezone: initialSettings.timezone ?? 'Asia/Amman',
    brandColor: initialSettings.brandColor ?? '#dbec0a',
  });

  // Handle language change immediately for preview
  const handleLanguageChange = (newLang: string) => {
    setSettings(prev => ({ ...prev, language: newLang }));
    document.documentElement.lang = newLang;
    document.documentElement.dir = getDirection(newLang as 'en' | 'ar');
    document.documentElement.dataset.lang = newLang;
    document.cookie = `${LOCALE_COOKIE_NAME}=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent('controlplane-lang-change', { detail: newLang }));
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateSettings({
        language: settings.language as 'en' | 'ar',
        phoneFormat: settings.phoneFormat as 'local' | 'international',
        timezone: settings.timezone,
        brandColor: settings.brandColor,
      });

      if (result.success) {
        toast.success(t('settings.preferences.saved', 'Preferences updated'));
        document.documentElement.lang = settings.language;
        document.documentElement.dir = getDirection(settings.language as 'en' | 'ar');
        document.documentElement.dataset.lang = settings.language;
        document.body.style.setProperty('--primary', settings.brandColor);
        document.cookie = `${LOCALE_COOKIE_NAME}=${settings.language}; path=/; max-age=31536000; SameSite=Lax`;
        window.dispatchEvent(new CustomEvent('controlplane-lang-change', { detail: settings.language }));
        
        router.refresh();
      } else {
        toast.error(t('common.error', 'Something went wrong'));
      }
    });
  };

  const exportCsv = () => {
    toast.info(t('settings.data.export', 'Export CSV snapshot'));
  };

  const purgeDrafts = () => {
    if (confirm(t('settings.data.confirm', 'This only clears cached drafts on this device.'))) {
      localStorage.clear();
      toast.success(t('settings.data.purge', 'Purge local drafts'));
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('settings.heroTitle', 'Settings')}</h1>
        <p className="text-muted-foreground">
          {t('settings.heroSubtitle', 'Manage your preferences and application settings.')}
        </p>
      </div>

      <div className="grid gap-8">
        {/* Preferences Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b border-border/50 pb-2">
            {t('settings.preferences.title', 'Preferences')}
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Language */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t('settings.preferences.languageLabel', 'Language')}
              </label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={settings.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>

            {/* Phone Format */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t('settings.preferences.phoneLabel', 'Phone Format')}
              </label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={settings.phoneFormat}
                onChange={(e) => setSettings(prev => ({ ...prev, phoneFormat: e.target.value }))}
              >
                <option value="local">Local (07X)</option>
                <option value="international">International (+962)</option>
              </select>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t('settings.preferences.timezoneLabel', 'Timezone')}
              </label>
              <Input
                value={settings.timezone}
                onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
              />
            </div>

            {/* Brand Color */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t('settings.preferences.brandLabel', 'Brand Color')}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    value={settings.brandColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, brandColor: e.target.value }))}
                    className="pl-10"
                  />
                  <div 
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-border"
                    style={{ backgroundColor: settings.brandColor }}
                  />
                </div>
                <Input
                  type="color"
                  value={settings.brandColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, brandColor: e.target.value }))}
                  className="w-12 p-1 h-10 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.saving', 'Saving...')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t('settings.preferences.save', 'Save Changes')}
                </>
              )}
            </Button>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b border-border/50 pb-2">
            {t('settings.notifications.title', 'Notifications')}
          </h2>
          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">{t('settings.notifications.push', 'Push Notifications')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('settings.notifications.description', 'Receive updates about new orders and status changes.')}
                </p>
              </div>
              <NotificationToggle />
            </div>
          </div>
        </section>

        {/* Data Management Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b border-border/50 pb-2">
            {t('settings.data.title', 'Data Management')}
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" onClick={exportCsv}>
              {t('settings.data.export', 'Export Data')}
            </Button>
            <Button variant="destructive" onClick={purgeDrafts}>
              {t('settings.data.purge', 'Clear Cache')}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
