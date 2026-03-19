import { Suspense } from 'react';
import { BentoGrid, BentoCard } from '@/components/dashboard/bento-grid';
import {
  RevenueKPI,
  ProfitKPI,
} from '@/components/dashboard/server/overview-kpis';
import {
  PerformanceChartSection,
  InventorySection,
  ChannelSection,
  GlobalProductMomentum,
  ChartSkeleton,
} from '@/components/dashboard/server/dashboard-charts';
import { RecentActivitySection } from '@/components/dashboard/server/recent-activity';
import { LiveRadarWrapper } from '@/components/dashboard/live-radar-wrapper';
import { getServerTranslations } from '@/lib/server-i18n';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0';

export default async function DashboardPage() {
  const t = await getServerTranslations();

  return (
    <div className="space-y-8 pb-24 h-[calc(100dvh-4rem)] overflow-y-auto snap-y snap-proximity scrollbar-hide md:h-auto md:overflow-visible md:snap-none">
      {/* Command Center Header */}
      <div className="flex items-end justify-between px-2">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
            {t('dashboard.hero.meta')}
          </p>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            <span className="text-foreground">
              {t('dashboard.hero.titlePart1')}
            </span>{' '}
            <span className="text-premium-gradient">
              {t('dashboard.hero.titlePart2')}
            </span>
          </h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">v{APP_VERSION}</p>
        </div>
      </div>

      <BentoGrid>
        {/* Row 1: High Level KPIs */}
        <BentoCard
          colSpan={2}
          backgroundOpacity={0.25}>
          <Suspense
            fallback={
              <div className="h-full w-full bg-white/5 animate-pulse rounded-xl min-h-[100px]" />
            }>
            <RevenueKPI />
          </Suspense>
        </BentoCard>

        <BentoCard>
          <LiveRadarWrapper />
        </BentoCard>

        <BentoCard
          backgroundOpacity={0.25}>
          <Suspense
            fallback={
              <div className="h-full w-full bg-white/5 animate-pulse rounded-xl min-h-[100px]" />
            }>
            <ProfitKPI />
          </Suspense>
        </BentoCard>

        {/* Row 2: Performance Chart (Large) & Live Feed */}
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

        {/* Row 3: Channels & Inventory */}
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

        {/* Row 4: Product Momentum (Full Width or Large) */}
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
