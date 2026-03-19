'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Settings2 } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import { NotificationsHubButton } from '@/components/notifications/notifications-hub-button';
import { APP_LOGO_PATH, APP_NAME } from '@/lib/app-config';
import { LanguageSwitcher } from '@/components/language-switcher';

export function Navbar() {
  const { t, lang } = useTranslations();
  const initials = lang === 'ar' ? 'تش' : 'CP';

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      aria-label="Primary">
      {/* Frosted Glass Background with Mask Fade */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-xl border-b border-white/5 shadow-sm" />

      <div className="relative flex w-full items-center justify-between gap-3 px-4 pb-3 pt-[calc(0.85rem+var(--safe-top))] sm:px-6 lg:px-8">
        {/* Logo Area */}
        <Link
          href="/dashboard"
          className="group flex items-center gap-3 transition-opacity hover:opacity-90">
          <div className="relative">
            <div className="absolute -inset-2 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Image
              src={APP_LOGO_PATH}
              alt={APP_NAME}
              className="relative h-10 w-10"
              width={40}
              height={40}
            />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-semibold tracking-[0.08em] text-foreground">
              {APP_NAME}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground/80">
              {t('nav.taglineSub', 'Supplement operations command center')}
            </span>
          </div>
        </Link>

        {/* Actions Area */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <NotificationsHubButton />

          {/* User Pill (New) */}
          <div className="hidden sm:flex items-center gap-3 ps-3 border-s border-white/10">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-foreground leading-none">
                {t('user.name', 'Operations Lead')}
              </span>
              <span className="text-[10px] text-primary uppercase tracking-wider font-semibold">
                {t('user.role', 'Admin')}
              </span>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary via-accent to-chart-3 p-[1px]">
              <div className="h-full w-full rounded-full bg-background flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{initials}</span>
              </div>
            </div>
          </div>

          <Link
            href="/settings"
            aria-label={t('nav.settings', 'Settings')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-white/5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground sm:hidden">
            <Settings2 className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
