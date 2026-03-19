import { cookies } from 'next/headers';
import { LOCALE_COOKIE_NAME, isSupportedLanguage, type SupportedLanguage } from '@/lib/locale';
import { getAppSettings } from '@/lib/settings';

export async function resolveLanguage(): Promise<SupportedLanguage> {
  const cookieStore = await cookies();
  const cookieLanguage = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  if (cookieLanguage && isSupportedLanguage(cookieLanguage)) {
    return cookieLanguage;
  }

  const settings = await getAppSettings();
  return isSupportedLanguage(settings.language) ? settings.language : 'en';
}
