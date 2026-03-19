'server-only';

import { z } from 'zod';
import { deriveFeatureFlags } from '@/lib/feature-flags';

const emptyStringToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalString = z.preprocess(
  emptyStringToUndefined,
  z.string().min(1).optional(),
);

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),
  AUTH_SECRET: z.string().min(1, 'AUTH_SECRET is required'),
  NEXT_PUBLIC_APP_URL: z.preprocess(
    (value) => emptyStringToUndefined(value) ?? 'http://localhost:3000',
    z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  ),
  IMGBB_API_KEY: optionalString,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: optionalString,
  VAPID_PUBLIC_KEY: optionalString,
  VAPID_PRIVATE_KEY: optionalString,
  VAPID_SUBJECT: optionalString,
  DEMO_ADMIN_USERNAME: optionalString,
  DEMO_ADMIN_EMAIL: z.preprocess(
    emptyStringToUndefined,
    z.string().email().optional(),
  ),
  DEMO_ADMIN_PASSWORD: z.preprocess(
    emptyStringToUndefined,
    z.string().min(8).optional(),
  ),
});

export const env = serverEnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  IMGBB_API_KEY: process.env.IMGBB_API_KEY,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  VAPID_SUBJECT: process.env.VAPID_SUBJECT,
  DEMO_ADMIN_USERNAME: process.env.DEMO_ADMIN_USERNAME,
  DEMO_ADMIN_EMAIL: process.env.DEMO_ADMIN_EMAIL,
  DEMO_ADMIN_PASSWORD: process.env.DEMO_ADMIN_PASSWORD,
});

export const featureFlags = deriveFeatureFlags(env);
