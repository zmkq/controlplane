import { describe, expect, it } from 'vitest';
import {
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
