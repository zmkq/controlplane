'use client';

import { motion } from 'framer-motion';

import Link from 'next/link';
import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  ScrollText,
  Sparkles,
  Boxes,
  Users,
  Settings2,
  Receipt,
  FileText,
  Zap,
  TrendingUp,
  Clock,
  ChevronRight,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import { useOperationalMetrics } from '@/hooks/use-operational-metrics';

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslations();
  const { metrics } = useOperationalMetrics();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const formatter = useMemo(() => new Intl.NumberFormat('en-US'), []);
  const formatCount = (value: number | null) =>
    value === null || typeof value === 'undefined'
      ? '--'
      : formatter.format(value);

  // Staggered entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (sidebarRef.current) {
      const rect = sidebarRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  const navItems = [
    {
      href: '/dashboard',
      icon: LayoutDashboard,
      label: t('sidebar.nav.dashboard', 'Dashboard'),
      accent: '#06b6d4',
    },
    {
      href: '/sales',
      icon: ShoppingCart,
      label: t('sidebar.nav.sales', 'Sales'),
      accent: '#10b981',
    },
    {
      href: '/products',
      icon: Boxes,
      label: t('sidebar.nav.products', 'Products'),
      accent: '#8b5cf6',
    },
    {
      href: '/expenses',
      icon: Receipt,
      label: t('sidebar.nav.expenses', 'Expenses'),
      accent: '#f43f5e',
    },
    {
      href: '/agents',
      icon: Users,
      label: t('sidebar.nav.agents', 'Agents'),
      accent: '#f97316',
    },
    {
      href: '/reports',
      icon: FileText,
      label: t('sidebar.nav.reports', 'Reports'),
      accent: '#3b82f6',
    },
    {
      href: '/audit-logs',
      icon: ScrollText,
      label: t('sidebar.nav.audit', 'Audit Logs'),
      accent: '#64748b',
    },
    {
      href: '/settings',
      icon: Settings2,
      label: t('sidebar.nav.settings', 'Settings'),
      accent: '#71717a',
    },
  ];

  return (
    <aside
      ref={sidebarRef}
      onMouseMove={handleMouseMove}
      className={cn(
        'group/sidebar fixed top-0 start-0 z-40 hidden h-dvh flex-col lg:flex',
        'w-[280px] xl:w-[300px] 2xl:w-[320px]',
        'transition-all duration-700 ease-out',
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4',
      )}>
      {/* Main Glass Container */}
      <div
        className="absolute inset-0 backdrop-blur-2xl"
        style={{
          background: `
            linear-gradient(
              180deg,
              rgba(8, 10, 18, 0.92) 0%,
              rgba(5, 7, 14, 0.96) 50%,
              rgba(3, 4, 10, 0.98) 100%
            )
          `,
        }}
      />

      {/* Animated Aurora Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[100px] animate-pulse"
          style={{
            background:
              'radial-gradient(circle, rgba(219, 236, 10, 0.15) 0%, transparent 70%)',
            top: '-10%',
            left: '-20%',
            animationDuration: '4s',
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full blur-[80px] animate-pulse"
          style={{
            background:
              'radial-gradient(circle, rgba(98, 195, 255, 0.12) 0%, transparent 70%)',
            bottom: '10%',
            right: '-30%',
            animationDuration: '5s',
            animationDelay: '1s',
          }}
        />
      </div>

      {/* Mouse Spotlight */}
      <div
        className="pointer-events-none absolute w-[350px] h-[350px] opacity-0 group-hover/sidebar:opacity-60 transition-opacity duration-700 blur-[100px]"
        style={{
          background:
            'radial-gradient(circle, rgba(219, 236, 10, 0.25) 0%, rgba(98, 195, 255, 0.08) 40%, transparent 70%)',
          left: mousePosition.x - 175,
          top: mousePosition.y - 175,
          transition:
            'left 0.3s ease-out, top 0.3s ease-out, opacity 0.7s ease',
        }}
      />

      {/* Edge Borders */}
      <div className="absolute inset-y-0 end-0 w-px bg-gradient-to-b from-transparent via-white/[0.08] to-transparent" />
      <div className="absolute top-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute bottom-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          {
            top: '15%',
            left: '8%',
            size: 'w-1.5 h-1.5',
            color: 'bg-primary/50',
            delay: '0s',
          },
          {
            top: '35%',
            left: '85%',
            size: 'w-2 h-2',
            color: 'bg-cyan-400/40',
            delay: '0.5s',
          },
          {
            top: '55%',
            left: '12%',
            size: 'w-1 h-1',
            color: 'bg-violet-400/50',
            delay: '1s',
          },
          {
            top: '75%',
            left: '78%',
            size: 'w-1.5 h-1.5',
            color: 'bg-emerald-400/40',
            delay: '1.5s',
          },
          {
            top: '90%',
            left: '20%',
            size: 'w-1 h-1',
            color: 'bg-pink-400/30',
            delay: '2s',
          },
        ].map((orb, i) => (
          <div
            key={i}
            className={cn(
              'absolute rounded-full animate-pulse',
              orb.size,
              orb.color,
            )}
            style={{
              top: orb.top,
              left: orb.left,
              animationDelay: orb.delay,
              animationDuration: '3s',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full px-4 xl:px-5 pb-5 pt-24 xl:pt-28 overflow-y-auto scrollbar-hide">
        {/* Focus Card */}
        <div
          className={cn(
            'relative group/focus rounded-2xl xl:rounded-3xl p-4 xl:p-5 mb-4 xl:mb-5',
            'transition-all duration-500 ease-out hover:scale-[1.015]',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
          )}
          style={{
            transitionDelay: '200ms',
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: `
              0 4px 24px -4px rgba(0,0,0,0.5),
              0 0 0 1px rgba(255,255,255,0.02) inset,
              0 1px 0 rgba(255,255,255,0.05) inset
            `,
          }}>
          {/* Gradient overlay on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover/focus:opacity-100 transition-opacity duration-700 rounded-2xl xl:rounded-3xl pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, rgba(219, 236, 10, 0.08) 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="flex items-center justify-center w-7 h-7 xl:w-8 xl:h-8 rounded-xl shrink-0"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(219, 236, 10, 0.2) 0%, rgba(219, 236, 10, 0.08) 100%)',
                  boxShadow: '0 0 20px rgba(219, 236, 10, 0.15)',
                }}>
                <Zap className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-primary" />
              </div>
              <span className="text-[10px] xl:text-[11px] font-bold uppercase tracking-[0.15em] text-primary">
                {t('sidebar.focusTitle', "Today's focus")}
              </span>
            </div>
            <p className="text-[13px] xl:text-sm font-medium text-foreground/85 leading-relaxed mb-4">
              {t(
                'sidebar.focusBody',
                'Keep limited stock hot; trigger partner pulls only when real demand hits.',
              )}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  icon: TrendingUp,
                  color: '#10b981',
                  label: t('sidebar.limitedLabel', 'Limited'),
                  value: formatCount(metrics.limitedUnits),
                },
                {
                  icon: Clock,
                  color: '#06b6d4',
                  label: t('sidebar.queueLabel', 'On-Demand'),
                  value: formatCount(metrics.onDemandQueue),
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="rounded-xl p-3 transition-all duration-300 hover:bg-white/[0.04] min-h-[70px] flex flex-col"
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <stat.icon
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: stat.color }}
                    />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/50 leading-tight">
                      {stat.label}
                    </span>
                  </div>
                  <p
                    className="text-xl font-bold leading-none mt-auto"
                    style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-0.5">
          {navItems.map((item, index) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            const isHovered = hoveredNav === item.href;

            return (
              <motion.div
                key={item.href}
                whileHover={{ scale: 1.01, x: 2 }}
                whileTap={{ scale: 0.98 }}>
                <Link
                  href={item.href}
                  onMouseEnter={() => setHoveredNav(item.href)}
                  onMouseLeave={() => setHoveredNav(null)}
                  className={cn(
                    'group/nav relative flex items-center gap-3 rounded-xl px-3 py-2 xl:py-2.5 text-[13px] xl:text-sm font-medium',
                    'transition-all duration-300 ease-out',
                    isVisible
                      ? 'opacity-100 translate-x-0'
                      : 'opacity-0 -translate-x-2',
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  style={{
                    transitionDelay: `${300 + index * 40}ms`,
                  }}>
                  {/* Background Layers */}
                  <div
                    className={cn(
                      'absolute inset-0 rounded-xl transition-all duration-300',
                      isActive || isHovered ? 'opacity-100' : 'opacity-0',
                    )}
                    style={{
                      background: isActive
                        ? `linear-gradient(135deg, ${item.accent}15 0%, ${item.accent}05 100%)`
                        : 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                      border: isActive
                        ? `1px solid ${item.accent}30`
                        : '1px solid transparent',
                      boxShadow: isActive
                        ? `0 0 25px ${item.accent}15, inset 0 1px 0 rgba(255,255,255,0.05)`
                        : 'none',
                    }}
                  />

                  {/* Active Line */}
                  <div
                    className="absolute start-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all duration-300"
                    style={{
                      height: isActive ? '55%' : '0%',
                      background: isActive ? item.accent : 'transparent',
                      boxShadow: isActive
                        ? `0 0 12px ${item.accent}80`
                        : 'none',
                    }}
                  />

                  {/* Icon */}
                  <span
                    className={cn(
                      'relative z-10 flex h-8 w-8 xl:h-9 xl:w-9 items-center justify-center rounded-lg xl:rounded-xl',
                      'transition-all duration-300 ease-out',
                      'border bg-white/[0.03]',
                      isActive
                        ? 'scale-105'
                        : 'group-hover/nav:scale-105 group-hover/nav:bg-white/[0.06]',
                    )}
                    style={{
                      borderColor: isActive
                        ? `${item.accent}40`
                        : 'rgba(255,255,255,0.05)',
                      background: isActive ? `${item.accent}15` : undefined,
                      boxShadow: isActive
                        ? `0 0 20px ${item.accent}20`
                        : 'none',
                    }}>
                    <item.icon
                      className="h-4 w-4 transition-colors duration-300"
                      style={{ color: isActive ? item.accent : undefined }}
                    />
                  </span>

                  {/* Label */}
                  <span className="relative z-10 flex-1 transition-transform duration-300 group-hover/nav:translate-x-0.5">
                    {item.label}
                  </span>

                  {/* Arrow */}
                  <ChevronRight
                    className={cn(
                      'relative z-10 w-4 h-4 transition-all duration-300',
                      isActive
                        ? 'opacity-100 translate-x-0'
                        : 'opacity-0 -translate-x-2 group-hover/nav:opacity-50 group-hover/nav:translate-x-0',
                    )}
                    style={{ color: isActive ? item.accent : undefined }}
                  />
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Coach Card */}
      </div>

      {/* CSS for shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </aside>
  );
}
