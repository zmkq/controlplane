import { ar } from '@/locales/ar';
import { en } from '@/locales/en';
import type { SupportedLanguage } from '@/lib/locale';

export const translations = {
  en,
  ar,
} as const satisfies Record<SupportedLanguage, Record<string, unknown>>;
