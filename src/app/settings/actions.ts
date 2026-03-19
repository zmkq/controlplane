'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { updateAppSettings } from '@/lib/settings';
import {
  DEFAULT_APP_SETTINGS,
  isValidTimezone,
  normalizeBrandColor,
} from '@/lib/settings-config';

const updateSchema = z.object({
  language: z.enum(['en', 'ar']).optional(),
  phoneFormat: z.enum(['local', 'international']).optional(),
  timezone: z
    .string()
    .min(2)
    .max(60)
    .refine(isValidTimezone, 'Invalid timezone')
    .optional(),
  brandColor: z
    .string()
    .transform((value) => normalizeBrandColor(value))
    .refine((value) => value !== null, { message: 'Invalid hex colour' })
    .optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
});

export async function updateSettings(data: z.infer<typeof updateSchema>) {
  const validated = updateSchema.safeParse(data);

  if (!validated.success) {
    return {
      success: false as const,
      error: validated.error.issues[0]?.message ?? 'Failed to update settings',
    };
  }

  try {
    const settings = await updateAppSettings({
      ...validated.data,
      brandColor: validated.data.brandColor ?? undefined,
      language: validated.data.language ?? DEFAULT_APP_SETTINGS.language,
      phoneFormat:
        validated.data.phoneFormat ?? DEFAULT_APP_SETTINGS.phoneFormat,
      timezone: validated.data.timezone ?? DEFAULT_APP_SETTINGS.timezone,
      emailNotifications:
        validated.data.emailNotifications ??
        DEFAULT_APP_SETTINGS.emailNotifications,
      smsNotifications:
        validated.data.smsNotifications ??
        DEFAULT_APP_SETTINGS.smsNotifications,
    });

    revalidatePath('/', 'layout');
    return { success: true, settings };
  } catch (error) {
    console.error('Failed to update settings:', error);
    return { success: false, error: 'Failed to update settings' };
  }
}
