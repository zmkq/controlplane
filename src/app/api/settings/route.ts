import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAppSettings, updateAppSettings } from '@/lib/settings';
import { isValidTimezone, normalizeBrandColor } from '@/lib/settings-config';

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

export async function GET() {
  const settings = await getAppSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const data = updateSchema.safeParse(payload);

  if (!data.success) {
    return NextResponse.json(
      { error: data.error.issues[0]?.message ?? 'Invalid settings payload' },
      { status: 400 },
    );
  }

  const nextSettings = await updateAppSettings({
    ...data.data,
    brandColor: data.data.brandColor ?? undefined,
  });

  return NextResponse.json(nextSettings);
}
