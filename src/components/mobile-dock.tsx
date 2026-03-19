'use client';

import { motion } from 'framer-motion';

import type { ComponentType } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  ShoppingCart,
  Plus,
  Boxes,
  Settings2,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';

type DockLink = {
  href: string;
  labelKey?: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number | string }>;
  srLabelKey?: string;
};

const dockLinks: DockLink[] = [
  { href: '/dashboard', labelKey: 'dock.overview', icon: LayoutDashboard },
  { href: '/sales', labelKey: 'dock.sales', icon: ShoppingCart },
  { href: '/sales/new', srLabelKey: 'dock.addSr', icon: Plus }, // Middle item
  { href: '/products', labelKey: 'dock.products', icon: Boxes },
  { href: '/settings', labelKey: 'dock.settings', icon: Settings2 },
];

// Haptic feedback helper
function triggerHapticFeedback() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(15);
  }
}

export function MobileDock() {
  const pathname = usePathname();
  const { t } = useTranslations();

  return (
    <nav
      aria-label="Primary navigation"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(0.85rem+var(--safe-bottom))] lg:hidden">
      <div
        className="pointer-events-auto relative flex h-[4.5rem] w-full max-w-[430px] items-end justify-between rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,10,18,0.92)_0%,rgba(3,4,10,0.96)_100%)] px-2 pb-2 pt-1 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
        <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute inset-x-6 bottom-2 h-px bg-gradient-to-r from-transparent via-primary/12 to-transparent" />

        {dockLinks.map((item) => {
          const isAction = item.href === '/sales/new';
          const isSalesRoute = item.href === '/sales';
          const isActive = isAction
            ? pathname === item.href
            : isSalesRoute
              ? pathname === item.href ||
                (pathname.startsWith('/sales/') &&
                  !pathname.startsWith('/sales/new'))
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const label = item.labelKey
            ? t(item.labelKey, item.labelKey)
            : t(item.srLabelKey ?? 'dock.addSr', 'New Order');

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
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
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
    </nav>
  );
}
