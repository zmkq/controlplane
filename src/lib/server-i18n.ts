import { resolveLanguage } from '@/lib/server-locale';
import { translateKey } from '@/lib/translate';

export async function getServerTranslations() {
  const lang = await resolveLanguage();
  const t = (key: string, fallback?: string) => translateKey(lang, key, fallback);

  return t;
}
