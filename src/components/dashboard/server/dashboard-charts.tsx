import { getCachedMonthlyData, getCachedInventoryLevels, getCachedRecentOrders, getCachedProductPerformance } from '@/lib/cache';
import { 
  PerformanceChartClient, 
  InventoryDistributionClient, 
  ChannelPerformanceClient, 
  GlowingBarChartClient 
} from '@/components/dashboard/client/chart-loaders';
import { getServerTranslations } from '@/lib/server-i18n';


export async function PerformanceChartSection() {
  const monthlyData = await getCachedMonthlyData();

  // Transform data if needed (matches DashboardClient logic)
  const performanceData = monthlyData.map(m => ({
    name: m.name,
    revenue: m.revenue,
    expenses: m.expenses
  }));

  return <PerformanceChartClient data={performanceData} />;
}


export async function InventorySection() {
  const inventoryLevelsData = await getCachedInventoryLevels();

  let critical = 0;
  let low = 0;
  let healthy = 0;

  inventoryLevelsData.forEach(item => {
    if (item.quantity <= 0) {
      critical++;
    } else if (item.quantity <= 10) {
      low++;
    } else {
      healthy++;
    }
  });
  
  const inventoryDistData = [
    { name: 'Healthy', value: healthy },
    { name: 'Low Stock', value: low },
    { name: 'Critical', value: critical }
  ];

  return <InventoryDistributionClient data={inventoryDistData} />;
}


export async function ChannelSection() {
  const orders = await getCachedRecentOrders();
  
  const map = new Map<string, { count: number; revenue: number }>();
  orders.forEach(o => {
     const ch = o.channel || 'Direct';
     const total = Number(o.total ?? 0);
     const curr = map.get(ch) || { count: 0, revenue: 0 };
     map.set(ch, { count: curr.count + 1, revenue: curr.revenue + total });
  });
  
  const channelData = Array.from(map.entries()).map(([name, val]) => ({
     name,
     value: val.count,
     revenue: val.revenue
  }));

  return <ChannelPerformanceClient data={channelData} />;
}


export async function GlobalProductMomentum() {
  const productPerformanceData = await getCachedProductPerformance();
  const t = await getServerTranslations();

  const safeProductPerformanceData = Array.isArray(productPerformanceData)
    ? productPerformanceData
    : [];

  const productMomentumData = safeProductPerformanceData.map(item => ({
    label: item.name,
    value: item.value,
  }));

  const productMomentumTrend = (() => {
    if (productMomentumData.length < 2) return null;
    const head = productMomentumData[0]?.value ?? 0;
    const tail = productMomentumData[productMomentumData.length - 1]?.value ?? 0;
    if (!tail) return null;
    return ((head - tail) / tail) * 100;
  })();

  return (
    <div className="h-full flex flex-col">
       <GlowingBarChartClient
          data={productMomentumData}
          title={t('dashboard.charts.productMomentumTitle')}
          subtitle={t('dashboard.charts.productMomentumSubtitle')}
          trendLabel={t('dashboard.charts.unitsLabel')}
          trendDelta={productMomentumTrend}
          emptyMessage={t('dashboard.charts.productMomentumEmpty')}
        />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="h-full w-full flex items-center justify-center p-4">
      <div className="space-y-3 w-full h-full bg-white/5 rounded-xl animate-pulse" />
    </div>
  );
}
