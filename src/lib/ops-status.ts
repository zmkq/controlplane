import type { ServerEnv } from '@/lib/env-config';

export type FeatureState = 'enabled' | 'disabled' | 'partial';
export type OperationalWarningCode =
  | 'pushPartial'
  | 'imageUploadDisabled'
  | 'demoLoginDisabled';

const OPERATIONAL_WARNING_MESSAGES: Record<OperationalWarningCode, string> = {
  pushPartial:
    'Push notifications are only partially configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PUBLIC_KEY, and VAPID_PRIVATE_KEY together.',
  imageUploadDisabled: 'Image uploads are disabled until IMGBB_API_KEY is set.',
  demoLoginDisabled:
    'Local demo login seeding is disabled until DEMO_ADMIN_PASSWORD is set.',
};

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

export function getOperationalWarningCodes(
  source: ServerEnv,
): OperationalWarningCode[] {
  const warnings: OperationalWarningCode[] = [];
  const pushState = getPushFeatureState(source);

  if (pushState === 'partial') {
    warnings.push('pushPartial');
  }

  if (!source.IMGBB_API_KEY) {
    warnings.push('imageUploadDisabled');
  }

  if (!source.DEMO_ADMIN_PASSWORD) {
    warnings.push('demoLoginDisabled');
  }

  return warnings;
}

export function getOperationalWarningMessage(
  warning: OperationalWarningCode,
): string {
  return OPERATIONAL_WARNING_MESSAGES[warning];
}

export function getOperationalWarnings(source: ServerEnv): string[] {
  return getOperationalWarningCodes(source).map(getOperationalWarningMessage);
}
