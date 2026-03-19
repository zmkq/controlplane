import {
  DEFAULT_APP_SETTINGS,
  isValidTimezone,
  normalizeBrandColor,
} from '@/lib/settings-config';

describe('settings config helpers', () => {
  it('normalizes valid brand colors', () => {
    expect(normalizeBrandColor('  #ABC123 ')).toBe('#abc123');
    expect(normalizeBrandColor('#abc')).toBe('#abc');
  });

  it('rejects invalid brand colors', () => {
    expect(normalizeBrandColor('abc123')).toBeNull();
    expect(normalizeBrandColor('#12')).toBeNull();
  });

  it('validates supported timezones', () => {
    expect(isValidTimezone(DEFAULT_APP_SETTINGS.timezone)).toBe(true);
    expect(isValidTimezone('Mars/Olympus_Mons')).toBe(false);
  });
});
