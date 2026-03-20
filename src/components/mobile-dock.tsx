'use client';

import { motion } from 'framer-motion';

import { useMemo } from 'react';
import Link from 'next/link';
import { CircleDot, Plus } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';
import {
  findActiveNavigationItem,
  isNavigationItemActive,
  mobileDockNavigation,
} from '@/lib/navigation';

// Haptic feedback helper
function triggerHapticFeedback() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(15);
  }
}

export function MobileDock() {
  const pathname = usePathname();
  const { t } = useTranslations();
  const activeItem =
    findActiveNavigationItem(pathname, mobileDockNavigation) ??
    mobileDockNavigation[0];
  const activeLabel = useMemo(() => {
    return t(activeItem.labelKey, activeItem.labelFallback);
  }, [activeItem, t]);
  const activeDescription = t(
    activeItem.descriptionKey,
    activeItem.descriptionFallback,
  );
  const ActiveIcon = activeItem.icon;

  return (
    <nav
      aria-label="Primary navigation"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(1rem+var(--safe-bottom))] lg:hidden">
      <div
        className="pointer-events-auto relative w-full max-w-[460px] rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,10,18,0.96)_0%,rgba(3,4,10,0.98)_100%)] px-2 pb-2 pt-2 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-3xl">
        <div className="absolute inset-x-5 -top-7 flex justify-center">
          <div className="flex w-full max-w-[17rem] items-center gap-3 rounded-[1.3rem] border border-white/10 bg-black/70 px-3 py-2 shadow-[0_8px_25px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border"
              style={{
                borderColor: `${activeItem.accent}35`,
                backgroundColor: `${activeItem.accent}18`,
                color: activeItem.accent,
              }}>
              <ActiveIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                <CircleDot className="h-3 w-3 text-primary" />
                <span>{t('dock.activeSurface', 'Active surface')}</span>
              </div>
              <p className="truncate text-xs font-semibold text-foreground">
                {activeLabel}
              </p>
              <p className="hidden truncate text-[10px] text-muted-foreground min-[390px]:block">
                {activeDescription}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute inset-x-6 bottom-2 h-px bg-gradient-to-r from-transparent via-primary/12 to-transparent" />
        <div className="relative flex h-[4.75rem] items-end justify-between">

          {mobileDockNavigation.map((item) => {
            const isAction = item.href === '/sales/new';
            const isActive = isNavigationItemActive(pathname, item);
            const label = t(item.labelKey, item.labelFallback);

            if (isAction) {
              return (
                <div
                  key={item.href}
                  className="relative -top-5 flex flex-col items-center">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}>
                    <Link
                      href={item.href}
                      onClick={triggerHapticFeedback}
                      className={cn(
                        'flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-primary shadow-[0_0_22px_rgba(219,236,10,0.4)]',
                        'brand-glow',
                      )}
                      aria-label={label}>
                      <Plus
                        className="h-7 w-7 text-primary-foreground"
                        strokeWidth={3}
                      />
                    </Link>
                  </motion.div>
                  <span className="mt-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-primary/90">
                    {label}
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={triggerHapticFeedback}
                className={cn(
                  'group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-all duration-300',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                aria-current={isActive ? 'page' : undefined}
                aria-label={label}>
                {isActive && (
                  <div className="absolute inset-0 -z-10 flex items-center justify-center">
                    <motion.div
                      layoutId="active-nav-indicator"
                      className="h-9 w-14 rounded-2xl bg-primary/15 blur-md"
                      transition={{
                        type: 'spring',
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  </div>
                )}

                <item.icon
                  className={cn(
                    'h-[1.35rem] w-[1.35rem] transition-all duration-300',
                    isActive &&
                      'scale-110 drop-shadow-[0_0_8px_rgba(219,236,10,0.5)]',
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />

                <span
                  className={cn(
                    'text-[9px] font-semibold transition-all duration-300',
                    isActive
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-0 opacity-70 group-hover:opacity-100',
                  )}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
