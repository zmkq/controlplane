export const EXPORT_PROFILES = ['core', 'full'] as const;

export type ExportProfile = (typeof EXPORT_PROFILES)[number];

export type ExportDatasetKey =
  | 'settings'
  | 'products'
  | 'suppliers'
  | 'customers'
  | 'sales'
  | 'expenses'
  | 'notifications'
  | 'auditLogs'
  | 'pushSubscriptions';

export type ExportDatasetDescriptor = {
  key: ExportDatasetKey;
  fileName: `${string}.csv`;
  description: string;
  fullOnly?: boolean;
};

export const EXPORT_DATASETS: ReadonlyArray<ExportDatasetDescriptor> = [
  {
    key: 'settings',
    fileName: 'settings.csv',
    description: 'Application preferences and notification defaults.',
  },
  {
    key: 'products',
    fileName: 'products.csv',
    description: 'Product catalog, pricing, and stock levels.',
  },
  {
    key: 'suppliers',
    fileName: 'suppliers.csv',
    description: 'Supplier contacts and default lead times.',
  },
  {
    key: 'customers',
    fileName: 'customers.csv',
    description: 'Customer directory and segmentation fields.',
  },
  {
    key: 'sales',
    fileName: 'sales.csv',
    description: 'Sales orders with customer and line-item summaries.',
  },
  {
    key: 'expenses',
    fileName: 'expenses.csv',
    description: 'General expense ledger entries.',
  },
  {
    key: 'notifications',
    fileName: 'notifications.csv',
    description: 'Operator notifications and linked order references.',
  },
  {
    key: 'auditLogs',
    fileName: 'audit-logs.csv',
    description: 'Administrative audit trail entries.',
    fullOnly: true,
  },
  {
    key: 'pushSubscriptions',
    fileName: 'push-subscriptions.csv',
    description: 'Saved push notification subscription endpoints.',
    fullOnly: true,
  },
] as const;

export function parseExportProfile(value: string | null | undefined): ExportProfile {
  return value === 'full' ? 'full' : 'core';
}

export function getExportFileName(date: Date, profile: ExportProfile) {
  const timestamp = date.toISOString().replace(/[:]/g, '-').replace(/\.\d{3}Z$/, 'Z');
  return `controlplane-${profile}-export-${timestamp}.zip`;
}

export function getExportDatasets(profile: ExportProfile) {
  return EXPORT_DATASETS.filter(
    (dataset) => profile === 'full' || !dataset.fullOnly,
  );
}

export function getExportDatasetLabels(profile: ExportProfile) {
  return getExportDatasets(profile).map((dataset) => dataset.key);
}

export function getExportManifest(
  date: Date,
  profile: ExportProfile,
  counts: Partial<Record<ExportDatasetKey, number>>,
) {
  const datasets = getExportDatasets(profile).map((dataset) => ({
    ...dataset,
    records: counts[dataset.key] ?? 0,
  }));

  return {
    schemaVersion: 3,
    profile,
    profileLabel: profile === 'full' ? 'Full backup' : 'Core snapshot',
    exportedAt: date.toISOString(),
    datasetCount: datasets.length,
    totalRecords: datasets.reduce((sum, dataset) => sum + dataset.records, 0),
    datasets,
    notes:
      profile === 'full'
        ? []
        : [
            'Core snapshots exclude audit logs and push subscriptions. Use the full profile for disaster recovery exports.',
          ],
  };
}
