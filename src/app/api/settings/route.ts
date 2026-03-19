import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAppSettings, updateAppSettings } from '@/lib/settings';

const updateSchema = z.object({
  language: z.enum(['en', 'ar']).optional(),
  phoneFormat: z.enum(['local', 'international']).optional(),
  timezone: z.string().min(2).max(60).optional(),
  brandColor: z
    .string()
    .regex(/^#([0-9a-f]{6}|[0-9a-f]{3})$/i, { message: 'Invalid hex colour' })
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
  const data = updateSchema.parse(payload);
  const nextSettings = await updateAppSettings(data);

  return NextResponse.json(nextSettings);
}
