'use server';

import { prisma } from '@/lib/prisma';
import { type AppSettings } from '@prisma/client';
import { DEFAULT_APP_SETTINGS } from '@/lib/settings-config';
const SETTINGS_ID = 'singleton';

function fallbackSettings(): AppSettings {
  const now = new Date();
  return {
    id: SETTINGS_ID,
    ...DEFAULT_APP_SETTINGS,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getAppSettings(): Promise<AppSettings> {
  try {
    let settings = await prisma.appSettings.findUnique({ where: { id: SETTINGS_ID } });
    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          id: SETTINGS_ID,
          ...DEFAULT_APP_SETTINGS,
        },
      });
    }
    return settings;
  } catch (error) {
    console.warn('[settings] Falling back to default settings due to DB error:', error);
    return fallbackSettings();
  }
}

export type UpdateSettingsInput = Partial<Pick<AppSettings, 'language' | 'phoneFormat' | 'timezone' | 'brandColor' | 'emailNotifications' | 'smsNotifications'>>;

export async function updateAppSettings(input: UpdateSettingsInput): Promise<AppSettings> {
  try {
    return await prisma.appSettings.upsert({
      where: { id: SETTINGS_ID },
      update: input,
      create: {
        id: SETTINGS_ID,
        ...DEFAULT_APP_SETTINGS,
        ...input,
      },
    });
  } catch (error) {
    console.error('[settings] Failed to persist settings:', error);
    throw new Error('Settings service unavailable');
  }
}
