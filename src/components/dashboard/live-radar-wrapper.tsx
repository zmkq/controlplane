'use client';

import { useOperationalMetrics } from '@/hooks/use-operational-metrics';
import { LiveRadarCard } from '@/components/dashboard/holographic-kpi';
import { useTranslations } from '@/lib/i18n';

export function LiveRadarWrapper() {
  const { t } = useTranslations();
  const { metrics } = useOperationalMetrics();

  return (
    <LiveRadarCard
       label={t('dashboard.liveMetrics.live', 'Live Orders')}
       value={metrics?.liveOrders ?? 0}
    />
  );
}
