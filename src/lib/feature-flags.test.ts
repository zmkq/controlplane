import { describe, expect, it } from 'vitest';
import { deriveFeatureFlags } from '@/lib/feature-flags';

describe('deriveFeatureFlags', () => {
  it('marks push notifications disabled when the client VAPID key is missing', () => {
    expect(
      deriveFeatureFlags({
        VAPID_PUBLIC_KEY: 'server-public',
        VAPID_PRIVATE_KEY: 'server-private',
      }).pushNotifications,
    ).toBe(false);
  });

  it('marks push notifications enabled when both client and server keys exist', () => {
    expect(
      deriveFeatureFlags({
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'client-public',
        VAPID_PUBLIC_KEY: 'server-public',
        VAPID_PRIVATE_KEY: 'server-private',
      }).pushNotifications,
    ).toBe(true);
  });

  it('treats blank optional values as disabled features', () => {
    expect(
      deriveFeatureFlags({
        IMGBB_API_KEY: '   ',
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: '   ',
        VAPID_PUBLIC_KEY: 'server-public',
        VAPID_PRIVATE_KEY: 'server-private',
      }),
    ).toEqual({
      imageUpload: false,
      pushNotifications: false,
    });
  });
});
