import { ZodError } from 'zod';
import { getServerFeatureFlags, parseServerEnv } from '@/lib/env-config';

const requiredEnv = {
  DATABASE_URL: 'postgresql://pooled.example.com/postgres',
  DIRECT_URL: 'postgresql://direct.example.com/postgres',
  AUTH_SECRET: 'super-secret-value',
};

describe('parseServerEnv', () => {
  it('fills in defaults and trims blank optional values to undefined', () => {
    const env = parseServerEnv({
      ...requiredEnv,
      NODE_ENV: 'test',
      NEXT_PUBLIC_APP_URL: '   ',
      IMGBB_API_KEY: '   ',
      DEMO_ADMIN_EMAIL: '   ',
      DEMO_ADMIN_PASSWORD: '   ',
    });

    expect(env.NODE_ENV).toBe('test');
    expect(env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
    expect(env.IMGBB_API_KEY).toBeUndefined();
    expect(env.DEMO_ADMIN_EMAIL).toBeUndefined();
    expect(env.DEMO_ADMIN_PASSWORD).toBeUndefined();
  });

  it('rejects invalid optional values when they are provided', () => {
    expect(() =>
      parseServerEnv({
        ...requiredEnv,
        NEXT_PUBLIC_APP_URL: 'https://controlplane.example.com',
        DEMO_ADMIN_EMAIL: 'not-an-email',
      }),
    ).toThrow(ZodError);

    expect(() =>
      parseServerEnv({
        ...requiredEnv,
        NEXT_PUBLIC_APP_URL: 'https://controlplane.example.com',
        DEMO_ADMIN_PASSWORD: 'short',
      }),
    ).toThrow(ZodError);
  });

  it('derives feature flags from the parsed env contract', () => {
    const env = parseServerEnv({
      ...requiredEnv,
      NEXT_PUBLIC_APP_URL: 'https://controlplane.example.com',
      IMGBB_API_KEY: 'imgbb-key',
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'client-vapid',
      VAPID_PUBLIC_KEY: 'server-vapid',
      VAPID_PRIVATE_KEY: 'server-private-vapid',
    });

    expect(getServerFeatureFlags(env)).toEqual({
      imageUpload: true,
      pushNotifications: true,
    });
  });
});
