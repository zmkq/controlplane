import Link from 'next/link';
import { Suspense } from 'react';
import { Boxes, FileText, Plus } from 'lucide-react';
import { BentoCard, BentoGrid } from '@/components/dashboard/bento-grid';
import { LiveRadarWrapper } from '@/components/dashboard/live-radar-wrapper';
import {
  ChannelSection,
  ChartSkeleton,
  GlobalProductMomentum,
  InventorySection,
  PerformanceChartSection,
} from '@/components/dashboard/server/dashboard-charts';
import { RecentActivitySection } from '@/components/dashboard/server/recent-activity';
import {
  ProfitKPI,
  RevenueKPI,
} from '@/components/dashboard/server/overview-kpis';
import { Button } from '@/components/ui/button';
import { getServerTranslations } from '@/lib/server-i18n';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0';

export default async function DashboardPage() {
  const t = await getServerTranslations();
  const quickActions = [
    {
      href: '/sales/new',
      title: t('nav.cta', 'New Order'),
      description: t(
        'dashboard.quickActions.newOrder',
        'Start a fresh order flow without leaving the command view.',
      ),
      icon: Plus,
    },
    {
      href: '/products',
      title: t('sidebar.nav.products', 'Products'),
      description: t(
        'dashboard.quickActions.products',
        'Review inventory health and update active SKUs.',
      ),
      icon: Boxes,
    },
    {
      href: '/reports',
      title: t('sidebar.nav.reports', 'Reports'),
      description: t(
        'dashboard.quickActions.reports',
        'Open the latest revenue, margin, and channel readouts.',
      ),
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-6 pb-24 sm:space-y-8 md:pb-10">
      <section className="glass-panel relative overflow-hidden rounded-[2rem] border border-white/5 px-5 py-5 sm:px-6 sm:py-6">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(98,195,255,0.16),transparent_58%)] lg:block" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_rgba(219,236,10,0.8)]" />
                {t('dashboard.hero.meta')}
              </span>
              <span className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-primary">
                v{APP_VERSION}
              </span>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
                <span className="text-foreground">
                  {t('dashboard.hero.titlePart1')}
                </span>{' '}
                <span className="text-premium-gradient">
                  {t('dashboard.hero.titlePart2')}
                </span>
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                {t(
                  'dashboard.hero.subtitle',
                  'Stay on top of orders, stock pressure, and partner activity from one operational surface.',
                )}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:w-[34rem]">
            {quickActions.map((action) => (
              <Button
                key={action.href}
                asChild
                variant="glass"
                className="h-auto rounded-[1.5rem] border-white/10 bg-white/[0.04] px-4 py-4 text-left hover:bg-white/[0.08]">
                <Link
                  href={action.href}
                  className="flex h-full flex-col items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <action.icon className="h-4 w-4 text-primary" />
                  </span>
                  <span className="space-y-1">
                    <span className="block text-sm font-semibold text-foreground">
                      {action.title}
                    </span>
                    <span className="block text-xs leading-5 text-muted-foreground">
                      {action.description}
                    </span>
                  </span>
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </section>

      <BentoGrid>
        <BentoCard
          colSpan={2}
          backgroundOpacity={0.25}>
          <Suspense
            fallback={
              <div className="min-h-[100px] h-full w-full animate-pulse rounded-xl bg-white/5" />
            }>
            <RevenueKPI />
          </Suspense>
        </BentoCard>

        <BentoCard>
          <LiveRadarWrapper />
        </BentoCard>

        <BentoCard backgroundOpacity={0.25}>
          <Suspense
            fallback={
              <div className="min-h-[100px] h-full w-full animate-pulse rounded-xl bg-white/5" />
            }>
            <ProfitKPI />
          </Suspense>
        </BentoCard>

        <BentoCard
          colSpan={3}
          rowSpan={2}
          className="min-h-[300px] md:min-h-[350px]"
          backgroundImage="/assets/premium/hex-mesh.svg"
          backgroundOpacity={0.5}>
          <Suspense fallback={<ChartSkeleton />}>
            <PerformanceChartSection />
          </Suspense>
        </BentoCard>

        <BentoCard
          colSpan={1}
          rowSpan={2}
          className="min-h-[300px]"
          backgroundImage="/assets/premium/hex-mesh.svg"
          backgroundOpacity={0.6}>
          <Suspense fallback={<ChartSkeleton />}>
            <RecentActivitySection />
          </Suspense>
        </BentoCard>

        <BentoCard
          colSpan={2}
          rowSpan={2}
          className="min-h-[250px]"
          backgroundImage="/assets/premium/hex-mesh.svg"
          backgroundOpacity={0.5}>
          <Suspense fallback={<ChartSkeleton />}>
            <ChannelSection />
          </Suspense>
        </BentoCard>

        <BentoCard
          colSpan={2}
          rowSpan={2}
          backgroundOpacity={0.15}>
          <Suspense fallback={<ChartSkeleton />}>
            <InventorySection />
          </Suspense>
        </BentoCard>

        <BentoCard
          colSpan={4}
          rowSpan={2}
          className="min-h-[300px]"
          backgroundOpacity={0.25}>
          <Suspense fallback={<ChartSkeleton />}>
            <GlobalProductMomentum />
          </Suspense>
        </BentoCard>
      </BentoGrid>
    </div>
  );
}
