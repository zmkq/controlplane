'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AppSettings } from '@prisma/client';
import { Loader2, RotateCcw, Save } from 'lucide-react';
import { updateSettings } from '@/app/settings/actions';
import { NotificationToggle } from '@/components/pwa/notification-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useTranslations } from '@/lib/i18n';
import {
  DEFAULT_APP_SETTINGS,
  SUPPORTED_TIMEZONES,
  normalizeBrandColor,
} from '@/lib/settings-config';
import { getDirection, LOCALE_COOKIE_NAME } from '@/lib/locale';
import { toast } from '@/lib/toast';

type SettingsFormState = {
  language: 'en' | 'ar';
  phoneFormat: 'local' | 'international';
  timezone: string;
  brandColor: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
};

const TIMEZONE_DATALIST_ID = 'settings-timezone-options';

function toFormState(initialSettings: AppSettings): SettingsFormState {
  return {
    language:
      initialSettings.language === 'ar'
        ? 'ar'
        : DEFAULT_APP_SETTINGS.language,
    phoneFormat:
      initialSettings.phoneFormat === 'local'
        ? 'local'
        : DEFAULT_APP_SETTINGS.phoneFormat,
    timezone: initialSettings.timezone ?? DEFAULT_APP_SETTINGS.timezone,
    brandColor: initialSettings.brandColor ?? DEFAULT_APP_SETTINGS.brandColor,
    emailNotifications:
      initialSettings.emailNotifications ??
      DEFAULT_APP_SETTINGS.emailNotifications,
    smsNotifications:
      initialSettings.smsNotifications ?? DEFAULT_APP_SETTINGS.smsNotifications,
  };
}

function applyLanguagePreview(language: 'en' | 'ar') {
  document.documentElement.lang = language;
  document.documentElement.dir = getDirection(language);
  document.documentElement.dataset.lang = language;
  document.cookie = `${LOCALE_COOKIE_NAME}=${language}; path=/; max-age=31536000; SameSite=Lax`;
  window.dispatchEvent(
    new CustomEvent('controlplane-lang-change', { detail: language }),
  );
}

function applyAccentPreview(brandColor: string) {
  document.body.style.setProperty('--primary', brandColor);
}

export function SettingsClient({
  initialSettings,
}: {
  initialSettings: AppSettings;
}) {
  const { t } = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(() => toFormState(initialSettings));
  const [timezoneQuery, setTimezoneQuery] = useState(
    initialSettings.timezone ?? DEFAULT_APP_SETTINGS.timezone,
  );
  const [colorInput, setColorInput] = useState(
    initialSettings.brandColor ?? DEFAULT_APP_SETTINGS.brandColor,
  );

  const initialForm = useMemo(
    () => toFormState(initialSettings),
    [initialSettings],
  );

  const normalizedColor = normalizeBrandColor(colorInput);
  const hasValidTimezone = SUPPORTED_TIMEZONES.includes(timezoneQuery);
  const isDirty =
    settings.language !== initialForm.language ||
    settings.phoneFormat !== initialForm.phoneFormat ||
    timezoneQuery !== initialForm.timezone ||
    colorInput !== initialForm.brandColor ||
    settings.emailNotifications !== initialForm.emailNotifications ||
    settings.smsNotifications !== initialForm.smsNotifications;

  const commitTimezone = (nextTimezone: string) => {
    setTimezoneQuery(nextTimezone);
    setSettings((prev) => ({ ...prev, timezone: nextTimezone }));
  };

  const handleLanguageChange = (language: 'en' | 'ar') => {
    setSettings((prev) => ({ ...prev, language }));
    applyLanguagePreview(language);
  };

  const handleColorInputChange = (value: string) => {
    setColorInput(value);
    const nextColor = normalizeBrandColor(value);
    if (nextColor) {
      setSettings((prev) => ({ ...prev, brandColor: nextColor }));
      applyAccentPreview(nextColor);
    }
  };

  const handleReset = () => {
    setSettings(initialForm);
    setTimezoneQuery(initialForm.timezone);
    setColorInput(initialForm.brandColor);
    applyLanguagePreview(initialForm.language);
    applyAccentPreview(initialForm.brandColor);
    toast.info(t('common.messages.updated', 'Updated successfully'), {
      description: t(
        'settings.preferences.description',
        'Language, phone format, timezone, and accent colour.',
      ),
    });
  };

  const handleSave = () => {
    if (!normalizedColor) {
      toast.error(t('common.error', 'Something went wrong'), {
        description: 'Accent colour must be a valid hex value.',
      });
      return;
    }

    if (!hasValidTimezone) {
      toast.error(t('common.error', 'Something went wrong'), {
        description: 'Choose a valid timezone from the supported list.',
      });
      return;
    }

    startTransition(async () => {
      const result = await updateSettings({
        language: settings.language,
        phoneFormat: settings.phoneFormat,
        timezone: settings.timezone,
        brandColor: normalizedColor,
        emailNotifications: settings.emailNotifications,
        smsNotifications: settings.smsNotifications,
      });

      if (result.success) {
        applyLanguagePreview(settings.language);
        applyAccentPreview(normalizedColor);
        toast.success(
          t('settings.preferences.saved', 'Preferences updated'),
        );
        router.refresh();
        return;
      }

      toast.error(t('common.error', 'Something went wrong'), {
        description: result.error,
      });
    });
  };

  const exportCsv = () => {
    toast.info(t('settings.data.export', 'Export CSV snapshot'), {
      description: 'Preparing a ZIP snapshot with the latest operational CSVs.',
    });
    window.location.assign('/api/settings/export');
  };

  const purgeDrafts = () => {
    if (
      confirm(
        t(
          'settings.data.confirm',
          'This only clears cached drafts on this device.',
        ),
      )
    ) {
      localStorage.clear();
      toast.success(t('settings.data.purge', 'Purge local drafts'));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t('settings.heroTitle', 'Settings')}
        </h1>
        <p className="text-muted-foreground">
          {t(
            'settings.heroSubtitle',
            'Manage your preferences and application settings.',
          )}
        </p>
      </div>

      <div className="grid gap-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <h2 className="text-lg font-semibold">
              {t('settings.preferences.title', 'Preferences')}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={isPending || !isDirty}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t('settings.preferences.resetColor', 'Reset')}
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                {t('settings.preferences.languageLabel', 'Language')}
              </label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={settings.language}
                onChange={(event) =>
                  handleLanguageChange(event.target.value as 'en' | 'ar')
                }>
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                {t('settings.preferences.phoneLabel', 'Phone Format')}
              </label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={settings.phoneFormat}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    phoneFormat: event.target.value as 'local' | 'international',
                  }))
                }>
                <option value="local">Local (07X)</option>
                <option value="international">International (+962)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                {t('settings.preferences.timezoneLabel', 'Timezone')}
              </label>
              <Input
                list={TIMEZONE_DATALIST_ID}
                value={timezoneQuery}
                onChange={(event) => commitTimezone(event.target.value)}
                aria-invalid={!hasValidTimezone}
              />
              <datalist id={TIMEZONE_DATALIST_ID}>
                {SUPPORTED_TIMEZONES.map((timezone) => (
                  <option key={timezone} value={timezone} />
                ))}
              </datalist>
              {!hasValidTimezone && (
                <p className="text-xs text-destructive">
                  Choose a valid IANA timezone, for example `Asia/Amman`.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                {t('settings.preferences.brandLabel', 'Brand Color')}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    value={colorInput}
                    onChange={(event) =>
                      handleColorInputChange(event.target.value)
                    }
                    className="pl-10"
                    aria-invalid={!normalizedColor}
                  />
                  <div
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-border"
                    style={{
                      backgroundColor:
                        normalizedColor ?? DEFAULT_APP_SETTINGS.brandColor,
                    }}
                  />
                </div>
                <Input
                  type="color"
                  value={normalizedColor ?? DEFAULT_APP_SETTINGS.brandColor}
                  onChange={(event) =>
                    handleColorInputChange(event.target.value)
                  }
                  className="h-10 w-12 cursor-pointer p-1"
                />
              </div>
              {!normalizedColor && (
                <p className="text-xs text-destructive">
                  Use `#rgb` or `#rrggbb`.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="font-medium">
                  {t('settings.notifications.email', 'Email summaries')}
                </p>
                <p className="text-sm text-muted-foreground">
                  Daily summaries and admin workflow recaps.
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    emailNotifications: checked,
                  }))
                }
              />
            </div>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="font-medium">
                  {t('settings.notifications.sms', 'SMS escalation')}
                </p>
                <p className="text-sm text-muted-foreground">
                  Escalate urgent order issues to the phone on file.
                </p>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    smsNotifications: checked,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isPending || !isDirty}>
              {t('common.buttons.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                isPending || !isDirty || !normalizedColor || !hasValidTimezone
              }>
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

        <section className="space-y-4">
          <h2 className="border-b border-border/50 pb-2 text-lg font-semibold">
            {t('settings.notifications.title', 'Notifications')}
          </h2>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">
                  {t('settings.notifications.push', 'Push Notifications')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t(
                    'settings.notifications.description',
                    'Receive updates about new orders and status changes.',
                  )}
                </p>
              </div>
              <NotificationToggle />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b border-border/50 pb-2 text-lg font-semibold">
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
