import { translations } from '@/locales/translations';
import type { SupportedLanguage } from '@/lib/locale';

interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

function isTranslationDictionary(value: unknown): value is TranslationDictionary {
  return typeof value === 'object' && value !== null;
}

export function translateKey(
  language: SupportedLanguage,
  key: string,
  fallback?: string,
): string {
  const source = translations[language] ?? translations.en;
  const parts = key.split('.');
  let cursor: unknown = source;

  for (const part of parts) {
    if (isTranslationDictionary(cursor) && part in cursor) {
      cursor = cursor[part];
      continue;
    }

    return fallback ?? key;
  }

  return typeof cursor === 'string' ? cursor : fallback ?? key;
}
