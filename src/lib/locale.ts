export const SUPPORTED_LANGUAGES = ['en', 'ar'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LOCALE_COOKIE_NAME = 'controlplane-lang';

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);
}

export function getDirection(_language: SupportedLanguage): 'ltr' {
  void _language;
  return 'ltr';
}
