import { getDirection, isSupportedLanguage } from '@/lib/locale';

describe('locale helpers', () => {
  it('keeps Arabic in an LTR layout', () => {
    expect(getDirection('ar')).toBe('ltr');
  });

  it('returns ltr for English', () => {
    expect(getDirection('en')).toBe('ltr');
  });

  it('validates supported languages', () => {
    expect(isSupportedLanguage('en')).toBe(true);
    expect(isSupportedLanguage('ar')).toBe(true);
    expect(isSupportedLanguage('fr')).toBe(false);
  });
});
