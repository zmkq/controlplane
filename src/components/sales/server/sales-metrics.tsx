import { Suspense } from 'react';
import { getCachedSalesPageMetrics } from '@/lib/cache';
import { BentoGrid, BentoCard } from '@/components/dashboard/bento-grid';
import { RevenueCard, LiveRadarCard } from '@/components/dashboard/holographic-kpi';
import { getServerTranslations } from '@/lib/server-i18n';

export async function SalesMetrics() {
  const metrics = await getCachedSalesPageMetrics();
  const t = await getServerTranslations();

  return (
    <BentoGrid className="md:grid-cols-3">
      <BentoCard>
        <RevenueCard
          label={t('sales.metrics.revenue', 'Weekly Revenue')}
          value={`JOD ${metrics.revenueThisWeek.toLocaleString()}`}
          trend="+12%" // Placeholder
        />
      </BentoCard>
      <BentoCard>
        <LiveRadarCard
          label={t('sales.metrics.active', 'Active Orders')}
          value={metrics.pendingCount}
        />
      </BentoCard>
      <BentoCard>
        <div className="flex h-full flex-col justify-between">
           <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
             {t('sales.metrics.latestChannel', 'Latest Channel')}
           </span>
           <div className="flex items-center gap-3">
             <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-2xl">
               {metrics.latestChannel === 'instagram' ? '📸' : metrics.latestChannel === 'whatsapp' ? '💬' : '🌐'}
             </div>
             <p className="text-2xl font-bold capitalize text-foreground">{metrics.latestChannel}</p>
           </div>
        </div>
      </BentoCard>
    </BentoGrid>
  );
}

export function SalesMetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 w-full bg-white/5 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}
