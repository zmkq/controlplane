export const EXPORT_PROFILES = ['core', 'full'] as const;

export type ExportProfile = (typeof EXPORT_PROFILES)[number];

export function parseExportProfile(value: string | null | undefined): ExportProfile {
  return value === 'full' ? 'full' : 'core';
}

export function getExportFileName(date: Date, profile: ExportProfile) {
  const timestamp = date.toISOString().replace(/[:]/g, '-').replace(/\.\d{3}Z$/, 'Z');
  return `controlplane-${profile}-export-${timestamp}.zip`;
}

export function getExportDatasetLabels(profile: ExportProfile) {
  if (profile === 'full') {
    return [
      'settings',
      'products',
      'suppliers',
      'customers',
      'sales',
      'expenses',
      'notifications',
      'auditLogs',
      'pushSubscriptions',
    ] as const;
  }

  return [
    'settings',
    'products',
    'suppliers',
    'customers',
    'sales',
    'expenses',
    'notifications',
  ] as const;
}
