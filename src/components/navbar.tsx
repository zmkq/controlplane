'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Settings2 } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { NotificationsHubButton } from '@/components/notifications/notifications-hub-button';
import { APP_LOGO_PATH, APP_NAME } from '@/lib/app-config';
import { useTranslations } from '@/lib/i18n';

export function Navbar() {
  const { t, lang } = useTranslations();
  const initials = lang === 'ar' ? 'تش' : 'CP';

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      aria-label="Primary">
      <div className="absolute inset-0 border-b border-white/10 bg-[linear-gradient(180deg,rgba(2,3,10,0.92)_0%,rgba(2,3,10,0.78)_100%)] shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-2xl" />
      <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

      <div className="relative flex w-full items-center justify-between gap-3 px-4 pb-3 pt-[calc(0.85rem+var(--safe-top))] sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="group flex min-w-0 items-center gap-3 rounded-2xl px-1 py-1 transition-opacity hover:opacity-90">
          <div className="relative">
            <div className="absolute -inset-2 bg-primary/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
            <Image
              src={APP_LOGO_PATH}
              alt={APP_NAME}
              className="relative h-10 w-10"
              width={40}
              height={40}
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold tracking-[0.08em] text-foreground">
              {APP_NAME}
            </span>
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground/80 sm:block">
              {t('nav.taglineSub', 'Supplement operations command center')}
            </span>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>
          <NotificationsHubButton />

          <div className="hidden lg:flex items-center gap-3 border-s border-white/10 ps-3">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold leading-none text-foreground">
                {t('user.name', 'Operations Lead')}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                {t('user.role', 'Admin')}
              </span>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary via-accent to-chart-3 p-[1px]">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-background">
                <span className="text-xs font-bold text-primary">{initials}</span>
              </div>
            </div>
          </div>

          <Link
            href="/settings"
            aria-label={t('nav.settings', 'Settings')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-muted-foreground transition hover:border-white/20 hover:bg-white/10 hover:text-foreground lg:hidden">
            <Settings2 className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
