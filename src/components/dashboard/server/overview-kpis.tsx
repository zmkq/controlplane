import { Suspense } from 'react';
import { getCachedDashboardKPIs, getCachedGrowthMetrics } from '@/lib/cache';
import { RevenueCard, ProfitCard } from '@/components/dashboard/holographic-kpi';
import { BentoCard } from '@/components/dashboard/bento-grid';
import Link from 'next/link';
import { getServerTranslations } from '@/lib/server-i18n';

async function RevenueKPI() {
  const [kpis, growth] = await Promise.all([
    getCachedDashboardKPIs(),
    getCachedGrowthMetrics()
  ]);
  
  const revenueGrowth = growth.lastMonthRevenue > 0 
    ? ((kpis.totalRevenue - growth.lastMonthRevenue) / growth.lastMonthRevenue) * 100 
    : 0;

  const t = await getServerTranslations();

  return (
    <RevenueCard
      label={t('dashboard.kpis.revenue')}
      value={`JOD ${kpis.totalRevenue.toLocaleString()}`}
      trend={revenueGrowth !== undefined ? `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%` : 'N/A'}
    />
  );
}

async function ProfitKPI() {
  const [kpis, growth] = await Promise.all([
    getCachedDashboardKPIs(),
    getCachedGrowthMetrics()
  ]);

  const profitGrowth = growth.lastMonthProfit > 0 
    ? ((kpis.netProfit - growth.lastMonthProfit) / growth.lastMonthProfit) * 100 
    : 0;

  const t = await getServerTranslations();

  return (
    <Link href="/profits" className="block h-full">
      <ProfitCard
        label={t('dashboard.kpis.profit')}
        value={`JOD ${kpis.netProfit.toLocaleString()}`}
        trend={profitGrowth !== undefined ? `${profitGrowth > 0 ? '+' : ''}${profitGrowth.toFixed(1)}%` : 'N/A'}
      />
    </Link>
  );
}

export function OverviewKPIsSkeleton() {
  return (
    <>
      <BentoCard colSpan={2}>
        <div className="h-full flex flex-col justify-between">
          <div className="h-4 w-24 bg-muted/20 rounded animate-pulse" />
          <div className="h-10 w-32 bg-muted/20 rounded animate-pulse" />
        </div>
      </BentoCard>
      {/* Live Radar Placeholder */}
      <BentoCard>
         <div className="h-full flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-muted/10 animate-pulse" />
         </div>
      </BentoCard>
      <BentoCard>
        <div className="h-full flex flex-col justify-between">
          <div className="h-4 w-24 bg-muted/20 rounded animate-pulse" />
          <div className="h-10 w-32 bg-muted/20 rounded animate-pulse" />
        </div>
      </BentoCard>
    </>
  );
}

export { RevenueKPI, ProfitKPI };
