'use client';

import { useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PackageCheck, Zap, ArrowUpRight, Users, Sparkles, Truck } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import { useOperationalMetrics } from '@/hooks/use-operational-metrics';
import { BentoGrid, BentoCard } from '@/components/dashboard/bento-grid';
import { RevenueCard, ProfitCard, LiveRadarCard } from '@/components/dashboard/holographic-kpi';
import { cn } from '@/lib/utils';
// Lazy load new components
const PerformanceChartComponent = dynamic(
  () => import('@/components/dashboard/performance-chart').then(mod => ({ default: mod.PerformanceChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const InventoryDistributionComponent = dynamic(
  () => import('@/components/dashboard/inventory-distribution').then(mod => ({ default: mod.InventoryDistribution })),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const LiveActivityFeedComponent = dynamic(
  () => import('@/components/dashboard/live-activity-feed').then(mod => ({ default: mod.LiveActivityFeed })),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const ChannelPerformanceComponent = dynamic(
  () => import('@/components/dashboard/channel-performance').then(mod => ({ default: mod.ChannelPerformance })),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
// Lazy load heavy chart components - reduces initial bundle by ~80KB
const LineChartComponent = dynamic(
  () => import('@/components/charts/LineChartComponent').then(mod => ({ default: mod.LineChartComponent })),
  { 
    ssr: false,
    loading: () => <ChartSkeleton />
  }
);

const GlowingBarChart = dynamic(
  () => import('@/components/charts/GlowingBarChart').then(mod => ({ default: mod.GlowingBarChart })),
  { 
    ssr: false,
    loading: () => <ChartSkeleton />
  }
);

// Lightweight skeleton for chart loading
function ChartSkeleton() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="space-y-3 w-full">
        <div className="h-4 w-1/3 bg-white/5 rounded animate-pulse" />
        <div className="h-48 w-full bg-white/5 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

type OrderItemSummary = { name: string; quantity: number };
type Order = {
  id: string;
  customer: string;
  channel: string;
  total: number;
  fulfillmentType: 'limited' | 'on-demand';
  status: string;
  eta: string;
  phone?: string;
  address?: string;
  deliveryFee?: number;
  items?: OrderItemSummary[];
  merchandiseTotal?: number;
};

type LimitedStockItem = {
  sku: string;
  name: string;
  qty: number;
  margin: number;
  trend: number;
};

type Partner = {
  name: string;
  turnaround: string;
  reliability: number;
  note: string;
};

interface DashboardClientProps {
  kpis?: {
    revenue: number;
    profit: number;
    avgFulfillment: string;
    pendingOrders: number;
    revenueGrowth?: number;
    profitGrowth?: number;
  };
  orderMix?: {
    limited: number;
    onDemand: number;
  };
  orders?: Order[];
  limitedStock?: LimitedStockItem[];
  partners?: Partner[];
  monthlyData?: { name: string; revenue: number; expenses: number }[];
  productPerformanceData?: { name: string; value: number }[];
  inventoryLevelsData?: { name: string; value: number }[];
}

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0';

export function DashboardClient({
  kpis,
  orderMix,
  orders = [],
  limitedStock = [],
  partners = [],
  monthlyData = [],
  productPerformanceData = [],
  inventoryLevelsData = [],
}: DashboardClientProps) {
  const { t } = useTranslations();
  const { metrics, loading: metricsLoading } = useOperationalMetrics();

  const safeKpis = useMemo(
    () => ({
      revenue: kpis?.revenue ?? 0,
      profit: kpis?.profit ?? 0,
      pendingOrders: kpis?.pendingOrders ?? 0,
      avgFulfillment: kpis?.avgFulfillment ?? 'N/A',
      revenueGrowth: kpis?.revenueGrowth,
      profitGrowth: kpis?.profitGrowth,
    }),
    [kpis?.avgFulfillment, kpis?.pendingOrders, kpis?.profit, kpis?.revenue, kpis?.revenueGrowth, kpis?.profitGrowth]
  );

  const productMomentumData = useMemo(
    () =>
      (productPerformanceData ?? []).map((item) => ({
        label: item.name,
        value: item.value,
      })),
    [productPerformanceData]
  );

  const productMomentumTrend = useMemo(() => {
    if (productMomentumData.length < 2) return null;
    const head = productMomentumData[0]?.value ?? 0;
    const tail =
      productMomentumData[productMomentumData.length - 1]?.value ?? 0;
    if (!tail) return null;
    return ((head - tail) / tail) * 100;
  }, [productMomentumData]);

  // Transform monthly data for Performance Chart
  const performanceData = useMemo(() => {
     if (!monthlyData || monthlyData.length === 0) return [];
     return monthlyData.map(m => ({
        name: m.name,
        revenue: m.revenue,
        expenses: m.expenses // Assuming 'expenses' exists on monthlyData
     }));
  }, [monthlyData]);

  // Transform inventory data for Distribution Chart
  const inventoryDistData = useMemo(() => {
     if (!inventoryLevelsData || inventoryLevelsData.length === 0) {
        // Fallback for visual if no data (e.g. dev mode)
        return [
           { name: 'Healthy', value: 0 },
           { name: 'Low Stock', value: 0 },
           { name: 'Critical', value: 0 }
        ];
     }

     let critical = 0;
     let low = 0;
     let healthy = 0;

     // Calculate status based on quantity
     inventoryLevelsData.forEach(item => {
        if (item.value <= 0) {
           critical++;
        } else if (item.value <= 10) {
           low++;
        } else {
           healthy++;
        }
     });
     
     return [
        { name: 'Healthy', value: healthy },
        { name: 'Low Stock', value: low },
        { name: 'Critical', value: critical }
     ];
  }, [inventoryLevelsData]);

  // Transform recent orders to live activities
  const liveActivities = useMemo(() => {
     if (!orders || orders.length === 0) return undefined; // Let component handle empty/mock
     return orders.slice(0, 10).map(order => ({
        id: order.id,
        type: (order.status === 'DELIVERED' ? 'delivery' : 'sale') as 'sale' | 'delivery' | 'system',
        message: `${order.status === 'DELIVERED' ? 'Order delivered' : 'New order'} ${order.customer ? `from ${order.customer.split(' ')[0]}` : ''}`,
        time: order.eta === 'Same day (<6h)' ? 'Just now' : 'Recent', // Simplified active relative time
        amount: order.total,
        user: order.customer.substring(0, 2).toUpperCase()
     }));
  }, [orders]);

  // Transform orders for Channel Chart
  const channelData = useMemo(() => {
     if (!orders || orders.length === 0) return [];
     
     const map = new Map<string, { count: number; revenue: number }>();
     orders.forEach(o => {
        const ch = o.channel || 'Direct';
        const curr = map.get(ch) || { count: 0, revenue: 0 };
        map.set(ch, { count: curr.count + 1, revenue: curr.revenue + (o.total || 0) });
     });
     
     return Array.from(map.entries()).map(([name, val]) => ({
        name,
        value: val.count,
        revenue: val.revenue
     }));
  }, [orders]);


  return (
    <div className="space-y-8 pb-24 h-[calc(100dvh-4rem)] overflow-y-auto snap-y snap-proximity scrollbar-hide md:h-auto md:overflow-visible md:snap-none">
      {/* Command Center Header */}
      <div className="flex items-end justify-between px-2">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
            {t('dashboard.hero.meta')}
          </p>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            <span className="text-foreground">Command</span>{' '}
            <span className="text-premium-gradient">Center</span>
          </h1>
        </div>
        <div className="text-right">
           <p className="text-xs text-muted-foreground">v{APP_VERSION}</p>
        </div>
      </div>

      <BentoGrid>
        {/* Row 1: High Level KPIs */}
        <BentoCard colSpan={2}>
          <RevenueCard
            label={t('dashboard.kpis.revenue')}
            value={`JOD ${safeKpis.revenue.toLocaleString()}`}
            trend={safeKpis.revenueGrowth !== undefined ? `${safeKpis.revenueGrowth > 0 ? '+' : ''}${safeKpis.revenueGrowth.toFixed(1)}%` : 'N/A'}
          />
        </BentoCard>

        <BentoCard>
          <LiveRadarCard
            label={t('dashboard.liveMetrics.live', 'Live Orders')}
            value={metrics?.liveOrders ?? 0}
          />
        </BentoCard>

        <BentoCard>
          <Link href="/profits" className="block h-full">
            <ProfitCard
              label={t('dashboard.kpis.profit')}
              value={`JOD ${safeKpis.profit.toLocaleString()}`}
              trend={safeKpis.profitGrowth !== undefined ? `${safeKpis.profitGrowth > 0 ? '+' : ''}${safeKpis.profitGrowth.toFixed(1)}%` : 'N/A'}
            />
          </Link>
        </BentoCard>

        {/* Row 2: Performance Chart (Large) & Live Feed */}
        <BentoCard colSpan={3} rowSpan={2} className="min-h-[300px] md:min-h-[350px]">
           <PerformanceChartComponent data={performanceData} />
        </BentoCard>
        
        <BentoCard colSpan={1} rowSpan={2} className="min-h-[300px]">
           <LiveActivityFeedComponent activities={liveActivities} />
        </BentoCard>

        {/* Row 3: Channels & Inventory */}
        <BentoCard colSpan={2} rowSpan={2} className="min-h-[250px]">
             <ChannelPerformanceComponent data={channelData} />
        </BentoCard>

        <BentoCard colSpan={2} rowSpan={2}>
             <InventoryDistributionComponent data={inventoryDistData} />
        </BentoCard>

        {/* Row 4: Product Momentum (Full Width or Large) */}
        <BentoCard colSpan={4} rowSpan={2} className="min-h-[300px]">
             <div className="h-full flex flex-col">
               <GlowingBarChart
                  data={productMomentumData}
                  title={t('dashboard.charts.productMomentumTitle')}
                  subtitle={t('dashboard.charts.productMomentumSubtitle')}
                  trendLabel={t('dashboard.charts.unitsLabel')}
                  trendDelta={productMomentumTrend}
                  emptyMessage={t('dashboard.charts.productMomentumEmpty')}
                />
             </div>
        </BentoCard>

      </BentoGrid>
    </div>
  );
}
