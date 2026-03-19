'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';
import { getDirection, LOCALE_COOKIE_NAME } from '@/lib/locale';

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'AR' },
] as const;

type LanguageCode = (typeof languages)[number]['code'];

function syncDocumentLanguage(code: LanguageCode) {
  const html = document.documentElement;
  html.lang = code;
  html.dir = getDirection(code);
  html.setAttribute('data-lang', code);
  document.cookie = `${LOCALE_COOKIE_NAME}=${code}; path=/; max-age=31536000; SameSite=Lax`;
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang: currentLanguage } = useTranslations();

  const applyLanguage = (code: LanguageCode) => {
    const lang = languages.find((item) => item.code === code) ?? languages[0];
    localStorage.setItem(LOCALE_COOKIE_NAME, lang.code);
    syncDocumentLanguage(lang.code);
    window.dispatchEvent(
      new CustomEvent('controlplane-lang-change', { detail: lang.code }),
    );
  };

  return (
    <div
      className={cn(
        'inline-flex border border-border/60 bg-background/40 p-1 text-xs font-semibold',
        compact ? 'rounded-xl' : 'rounded-2xl',
      )}>
      {languages.map((language) => (
        <Button
          key={language.code}
          variant="ghost"
          size="sm"
          className={cn(
            compact
              ? 'h-8 rounded-lg px-2.5 text-[10px] tracking-[0.24em]'
              : 'h-8 rounded-xl px-3 text-[11px] tracking-[0.3em]',
            language.code === currentLanguage &&
              'brand-glow text-primary-foreground'
          )}
          onClick={() => applyLanguage(language.code)}
        >
          {language.label}
        </Button>
      ))}
    </div>
  );
}
