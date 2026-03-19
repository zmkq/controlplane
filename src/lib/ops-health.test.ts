import { describe, expect, it } from 'vitest';
import {
  getOperationalWarningCodes,
  getOperationalWarningMessage,
  getOperationalWarnings,
  getPushFeatureState,
} from '@/lib/ops-status';

describe('getPushFeatureState', () => {
  it('returns enabled when both client and server VAPID keys are present', () => {
    expect(
      getPushFeatureState({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://pooled.example.com/postgres',
        DIRECT_URL: 'postgresql://direct.example.com/postgres',
        AUTH_SECRET: 'super-secret-value',
        NEXT_PUBLIC_APP_URL: 'https://controlplane.example.com',
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'client-public',
        VAPID_PUBLIC_KEY: 'server-public',
        VAPID_PRIVATE_KEY: 'server-private',
        VAPID_SUBJECT: undefined,
        IMGBB_API_KEY: undefined,
        DEMO_ADMIN_USERNAME: undefined,
        DEMO_ADMIN_EMAIL: undefined,
        DEMO_ADMIN_PASSWORD: undefined,
      }),
    ).toBe('enabled');
  });

  it('returns partial when only some push configuration exists', () => {
    expect(
      getPushFeatureState({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://pooled.example.com/postgres',
        DIRECT_URL: 'postgresql://direct.example.com/postgres',
        AUTH_SECRET: 'super-secret-value',
        NEXT_PUBLIC_APP_URL: 'https://controlplane.example.com',
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'client-public',
        VAPID_PUBLIC_KEY: undefined,
        VAPID_PRIVATE_KEY: undefined,
        VAPID_SUBJECT: undefined,
        IMGBB_API_KEY: undefined,
        DEMO_ADMIN_USERNAME: undefined,
        DEMO_ADMIN_EMAIL: undefined,
        DEMO_ADMIN_PASSWORD: undefined,
      }),
    ).toBe('partial');
  });
});

describe('getOperationalWarnings', () => {
  it('returns stable warning codes for optional feature gaps', () => {
    expect(
      getOperationalWarningCodes({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://pooled.example.com/postgres',
        DIRECT_URL: 'postgresql://direct.example.com/postgres',
        AUTH_SECRET: 'super-secret-value',
        NEXT_PUBLIC_APP_URL: 'https://controlplane.example.com',
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'client-public',
        VAPID_PUBLIC_KEY: undefined,
        VAPID_PRIVATE_KEY: undefined,
        VAPID_SUBJECT: undefined,
        IMGBB_API_KEY: undefined,
        DEMO_ADMIN_USERNAME: undefined,
        DEMO_ADMIN_EMAIL: undefined,
        DEMO_ADMIN_PASSWORD: undefined,
      }),
    ).toEqual([
      'pushPartial',
      'imageUploadDisabled',
      'demoLoginDisabled',
    ]);
  });

  it('flags missing optional features and partial push configuration', () => {
    expect(
      getOperationalWarnings({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://pooled.example.com/postgres',
        DIRECT_URL: 'postgresql://direct.example.com/postgres',
        AUTH_SECRET: 'super-secret-value',
        NEXT_PUBLIC_APP_URL: 'https://controlplane.example.com',
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'client-public',
        VAPID_PUBLIC_KEY: undefined,
        VAPID_PRIVATE_KEY: undefined,
        VAPID_SUBJECT: undefined,
        IMGBB_API_KEY: undefined,
        DEMO_ADMIN_USERNAME: undefined,
        DEMO_ADMIN_EMAIL: undefined,
        DEMO_ADMIN_PASSWORD: undefined,
      }),
    ).toEqual([
      'Push notifications are only partially configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PUBLIC_KEY, and VAPID_PRIVATE_KEY together.',
      'Image uploads are disabled until IMGBB_API_KEY is set.',
      'Local demo login seeding is disabled until DEMO_ADMIN_PASSWORD is set.',
    ]);
  });

  it('maps warning codes back to operator-facing messages', () => {
    expect(getOperationalWarningMessage('pushPartial')).toContain(
      'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
    );
  });
});
