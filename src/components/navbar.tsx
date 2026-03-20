'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FileText, Plus, RadioTower, Settings2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from '@/components/language-switcher';
import { NotificationsHubButton } from '@/components/notifications/notifications-hub-button';
import { APP_LOGO_PATH, APP_NAME } from '@/lib/app-config';
import { useTranslations } from '@/lib/i18n';
import { findActiveNavigationItem } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const { t, lang } = useTranslations();
  const initials = lang === 'ar' ? 'AR' : 'CP';
  const activeItem = findActiveNavigationItem(pathname) ?? {
    href: '/settings',
    labelKey: pathname?.startsWith('/notifications')
      ? 'notifications.title'
      : 'sidebar.nav.settings',
    labelFallback: pathname?.startsWith('/notifications')
      ? 'Notifications'
      : 'Settings',
    descriptionKey: pathname?.startsWith('/notifications')
      ? 'nav.notificationsDescription'
      : 'nav.settingsDescription',
    descriptionFallback: pathname?.startsWith('/notifications')
      ? 'Review incoming alerts, system prompts, and workflow interruptions in one place.'
      : 'Adjust system defaults, exports, and workspace preferences without leaving the shell.',
    accent: pathname?.startsWith('/notifications') ? '#dbec0a' : '#71717a',
    icon: pathname?.startsWith('/notifications') ? RadioTower : Settings2,
  };
  const activeSection = t(activeItem.labelKey, activeItem.labelFallback);
  const activeDescription = t(
    activeItem.descriptionKey,
    activeItem.descriptionFallback,
  );

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      aria-label="Primary">
      <div className="absolute inset-0 border-b border-white/10 bg-[linear-gradient(180deg,rgba(2,3,10,0.92)_0%,rgba(2,3,10,0.78)_100%)] shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-2xl" />
      <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

      <div className="relative flex w-full flex-wrap items-center justify-between gap-3 px-4 pb-3 pt-[calc(0.8rem+var(--safe-top))] sm:px-6 lg:flex-nowrap lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
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

          <div className="hidden md:flex min-w-0 items-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-3 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border"
              style={{
                borderColor: `${activeItem.accent}35`,
                backgroundColor: `${activeItem.accent}18`,
                color: activeItem.accent,
              }}>
              <activeItem.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 max-w-[18rem]">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/80">
                {t('nav.status', 'Live')}
              </p>
              <p className="truncate text-xs font-semibold text-foreground">
                {activeSection}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {activeDescription}
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden xl:flex items-center gap-2 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-1">
            <Link
              href="/sales/new"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(219,236,10,0.35)]">
              <Plus className="h-3.5 w-3.5" />
              {t('nav.cta', 'New Order')}
            </Link>
            <Link
              href="/reports"
              className={cn(
                'inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition',
                pathname?.startsWith('/reports')
                  ? 'bg-white/10 text-foreground'
                  : 'text-muted-foreground hover:bg-white/6 hover:text-foreground',
              )}>
              <FileText className="h-3.5 w-3.5" />
              {t('sidebar.nav.reports', 'Reports')}
            </Link>
          </div>

          <div className="min-[480px]:hidden">
            <LanguageSwitcher compact />
          </div>
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
