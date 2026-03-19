'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translateKey } from '@/lib/translate';
import type { SupportedLanguage } from '@/lib/locale';

type Translator = (key: string, fallback?: string) => string;

type I18nContextValue = {
  lang: SupportedLanguage;
  t: Translator;
};

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  t: (key, fallback) => fallback ?? key,
});

export function TranslationProvider({
  children,
  initialLang = 'en',
}: {
  children: React.ReactNode;
  initialLang?: SupportedLanguage;
}) {
  return (
    <TranslationProviderInner initialLang={initialLang}>
      {children}
    </TranslationProviderInner>
  );
}

function TranslationProviderInner({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang: SupportedLanguage;
}) {
  const [lang, setLang] = useState<SupportedLanguage>(initialLang);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<SupportedLanguage>).detail;
      if (detail) {
        setLang(detail);
      }
    };

    window.addEventListener('controlplane-lang-change', handler as EventListener);
    return () =>
      window.removeEventListener(
        'controlplane-lang-change',
        handler as EventListener,
      );
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const t: Translator = (key, fallback) => translateKey(lang, key, fallback);

    return { lang, t };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslations() {
  return useContext(I18nContext);
}
