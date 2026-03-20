import { describe, expect, it } from 'vitest';
import {
  getExportDatasets,
  getExportManifest,
  getExportDatasetLabels,
  getExportFileName,
  parseExportProfile,
} from '@/lib/settings-export';

describe('parseExportProfile', () => {
  it('defaults to the core profile for unknown values', () => {
    expect(parseExportProfile('unexpected')).toBe('core');
    expect(parseExportProfile(null)).toBe('core');
  });

  it('accepts the full profile explicitly', () => {
    expect(parseExportProfile('full')).toBe('full');
  });
});

describe('getExportFileName', () => {
  it('includes the profile and a filesystem-safe ISO timestamp', () => {
    expect(
      getExportFileName(new Date('2026-03-20T11:22:33.000Z'), 'full'),
    ).toBe('controlplane-full-export-2026-03-20T11-22-33Z.zip');
  });
});

describe('getExportDatasetLabels', () => {
  it('adds operational datasets only for full backups', () => {
    expect(getExportDatasetLabels('core')).not.toContain('auditLogs');
    expect(getExportDatasetLabels('full')).toContain('auditLogs');
    expect(getExportDatasetLabels('full')).toContain('pushSubscriptions');
  });
});

describe('getExportDatasets', () => {
  it('returns file metadata for the selected profile', () => {
    expect(getExportDatasets('core').map((dataset) => dataset.fileName)).toEqual(
      [
        'settings.csv',
        'products.csv',
        'suppliers.csv',
        'customers.csv',
        'sales.csv',
        'expenses.csv',
        'notifications.csv',
      ],
    );
    expect(getExportDatasets('full').map((dataset) => dataset.key)).toContain(
      'pushSubscriptions',
    );
  });
});

describe('getExportManifest', () => {
  it('builds a self-describing manifest with record totals', () => {
    expect(
      getExportManifest(new Date('2026-03-21T08:00:00.000Z'), 'core', {
        settings: 1,
        products: 4,
        suppliers: 2,
        customers: 5,
        sales: 8,
        expenses: 3,
        notifications: 6,
      }),
    ).toEqual({
      schemaVersion: 3,
      profile: 'core',
      profileLabel: 'Core snapshot',
      exportedAt: '2026-03-21T08:00:00.000Z',
      datasetCount: 7,
      totalRecords: 29,
      datasets: [
        {
          key: 'settings',
          fileName: 'settings.csv',
          description: 'Application preferences and notification defaults.',
          records: 1,
        },
        {
          key: 'products',
          fileName: 'products.csv',
          description: 'Product catalog, pricing, and stock levels.',
          records: 4,
        },
        {
          key: 'suppliers',
          fileName: 'suppliers.csv',
          description: 'Supplier contacts and default lead times.',
          records: 2,
        },
        {
          key: 'customers',
          fileName: 'customers.csv',
          description: 'Customer directory and segmentation fields.',
          records: 5,
        },
        {
          key: 'sales',
          fileName: 'sales.csv',
          description: 'Sales orders with customer and line-item summaries.',
          records: 8,
        },
        {
          key: 'expenses',
          fileName: 'expenses.csv',
          description: 'General expense ledger entries.',
          records: 3,
        },
        {
          key: 'notifications',
          fileName: 'notifications.csv',
          description: 'Operator notifications and linked order references.',
          records: 6,
        },
      ],
      notes: [
        'Core snapshots exclude audit logs and push subscriptions. Use the full profile for disaster recovery exports.',
      ],
    });
  });
});
