import type { ServerEnv } from '@/lib/env-config';

export type FeatureState = 'enabled' | 'disabled' | 'partial';

export function getPushFeatureState(source: ServerEnv): FeatureState {
  const hasClientKey = Boolean(source.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim());
  const hasServerKeys = Boolean(
    source.VAPID_PUBLIC_KEY?.trim() && source.VAPID_PRIVATE_KEY?.trim(),
  );

  if (hasClientKey && hasServerKeys) {
    return 'enabled';
  }

  if (hasClientKey || hasServerKeys || source.VAPID_SUBJECT?.trim()) {
    return 'partial';
  }

  return 'disabled';
}

export function getOperationalWarnings(source: ServerEnv): string[] {
  const warnings: string[] = [];
  const pushState = getPushFeatureState(source);

  if (pushState === 'partial') {
    warnings.push(
      'Push notifications are only partially configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PUBLIC_KEY, and VAPID_PRIVATE_KEY together.',
    );
  }

  if (!source.IMGBB_API_KEY) {
    warnings.push('Image uploads are disabled until IMGBB_API_KEY is set.');
  }

  if (!source.DEMO_ADMIN_PASSWORD) {
    warnings.push(
      'Local demo login seeding is disabled until DEMO_ADMIN_PASSWORD is set.',
    );
  }

  return warnings;
}
