'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

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

export async function updateSettings(data: z.infer<typeof updateSchema>) {
  try {
    const validated = updateSchema.parse(data);
    
    // Get or create settings
    const existing = await prisma.appSettings.findFirst();
    
    let settings;
    if (existing) {
      settings = await prisma.appSettings.update({
        where: { id: existing.id },
        data: validated,
      });
    } else {
      settings = await prisma.appSettings.create({
        data: {
          ...validated,
          // Set defaults if creating new
          language: validated.language ?? 'en',
          phoneFormat: validated.phoneFormat ?? 'local',
          timezone: validated.timezone ?? 'Asia/Amman',
          brandColor: validated.brandColor ?? '#dbec0a',
        },
      });
    }

    revalidatePath('/', 'layout');
    return { success: true, settings };
  } catch (error) {
    console.error('Failed to update settings:', error);
    return { success: false, error: 'Failed to update settings' };
  }
}
