import { z } from 'zod';
import { deriveFeatureFlags } from '@/lib/feature-flags';

const emptyStringToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalString = z.preprocess(
  emptyStringToUndefined,
  z.string().min(1).optional(),
);

export const serverEnvSchema = z.object({
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

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ServerFeatureFlags = ReturnType<typeof deriveFeatureFlags>;

export function parseServerEnv(source: Record<string, string | undefined | null>): ServerEnv {
  return serverEnvSchema.parse({
    NODE_ENV: source.NODE_ENV,
    DATABASE_URL: source.DATABASE_URL,
    DIRECT_URL: source.DIRECT_URL,
    AUTH_SECRET: source.AUTH_SECRET,
    NEXT_PUBLIC_APP_URL: source.NEXT_PUBLIC_APP_URL,
    IMGBB_API_KEY: source.IMGBB_API_KEY,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: source.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PUBLIC_KEY: source.VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: source.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT: source.VAPID_SUBJECT,
    DEMO_ADMIN_USERNAME: source.DEMO_ADMIN_USERNAME,
    DEMO_ADMIN_EMAIL: source.DEMO_ADMIN_EMAIL,
    DEMO_ADMIN_PASSWORD: source.DEMO_ADMIN_PASSWORD,
  });
}

export function getServerFeatureFlags(env: ServerEnv): ServerFeatureFlags {
  return deriveFeatureFlags(env);
}
