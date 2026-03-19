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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[calc(1rem+var(--safe-bottom))] lg:hidden">
      <div
        className="pointer-events-auto relative flex h-16 w-[90%] max-w-[400px] items-center justify-between rounded-3xl border border-white/10 bg-background/60 px-2 shadow-2xl backdrop-blur-2xl"
        role="tablist">
        {/* Glass Reflection Top */}
        <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {dockLinks.map((item) => {
          const isActive = pathname === item.href;
          const isAction = item.href === '/sales/new';

          if (isAction) {
            return (
              <div
                key={item.href}
                className="relative -top-6 flex flex-col items-center">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}>
                  <Link
                    href={item.href}
                    onClick={triggerHapticFeedback}
                    className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-primary shadow-[0_0_20px_rgba(219,236,10,0.4)]',
                      'brand-glow',
                    )}
                    aria-label={'New Order'}>
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
                'group relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-all duration-300',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-current={isActive ? 'page' : undefined}
              role="tab">
              {/* Active Spotlight */}
              {isActive && (
                <div className="absolute inset-0 -z-10 flex items-center justify-center">
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="h-8 w-12 rounded-xl bg-primary/15 blur-md"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                </div>
              )}

              <item.icon
                className={cn(
                  'h-6 w-6 transition-all duration-300',
                  isActive &&
                    'scale-110 drop-shadow-[0_0_8px_rgba(219,236,10,0.5)]',
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />

              {item.labelKey && (
                <span
                  className={cn(
                    'text-[9px] font-medium transition-all duration-300',
                    isActive
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-2 hidden',
                  )}>
                  {t(item.labelKey, item.labelKey)}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
