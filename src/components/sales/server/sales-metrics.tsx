import { Globe2, Instagram, MessageCircleMore } from 'lucide-react';
import { getCachedSalesPageMetrics } from '@/lib/cache';
import { BentoGrid, BentoCard } from '@/components/dashboard/bento-grid';
import { RevenueCard, LiveRadarCard } from '@/components/dashboard/holographic-kpi';
import { getServerTranslations } from '@/lib/server-i18n';

export async function SalesMetrics() {
  const metrics = await getCachedSalesPageMetrics();
  const t = await getServerTranslations();
  const ChannelIcon =
    metrics.latestChannel === 'instagram'
      ? Instagram
      : metrics.latestChannel === 'whatsapp'
        ? MessageCircleMore
        : Globe2;

  return (
    <BentoGrid className="md:grid-cols-3">
      <BentoCard>
        <RevenueCard
          label={t('sales.metrics.revenue', 'Weekly Revenue')}
          value={`JOD ${metrics.revenueThisWeek.toLocaleString()}`}
          trend="+12%"
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-primary">
              <ChannelIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold capitalize text-foreground">
                {metrics.latestChannel}
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {t('sales.metrics.channelPulse', 'Current traffic pulse')}
              </p>
            </div>
          </div>
        </div>
      </BentoCard>
    </BentoGrid>
  );
}

export function SalesMetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-32 w-full animate-pulse rounded-xl bg-white/5"
        />
      ))}
    </div>
  );
}
