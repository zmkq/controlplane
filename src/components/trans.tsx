'use client';

import { ElementType } from 'react';
import { useTranslations } from '@/lib/i18n';

type TransProps<T extends ElementType> = {
  k: string;
  fallback: string;
  as?: T;
} & Omit<React.ComponentPropsWithoutRef<T>, 'children'>;

export function Trans<T extends ElementType = 'span'>({
  k,
  fallback,
  as,
  ...props
}: TransProps<T>) {
  const { t } = useTranslations();
  const Comp = (as ?? 'span') as ElementType;
  return <Comp {...props}>{t(k, fallback)}</Comp>;
}
