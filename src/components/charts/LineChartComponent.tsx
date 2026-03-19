'use client';

import { useId, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useTranslations } from '@/lib/i18n';

interface LineChartProps {
  data?: { name: string; revenue: number; expenses: number }[];
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'JOD',
  maximumFractionDigits: 0,
});

export function LineChartComponent({ data = [] }: LineChartProps) {
  const { t } = useTranslations();
  const safeData = Array.isArray(data) ? data : [];

  const revenueTrend = useMemo(() => {
    if (safeData.length < 2) return null;
    const last = safeData[safeData.length - 1]?.revenue ?? 0;
    const prev = safeData[safeData.length - 2]?.revenue ?? 0;
    if (prev <= 0) return null;
    return Number((((last - prev) / prev) * 100).toFixed(1));
  }, [safeData]);

  const chartConfig = useMemo(
    () =>
      ({
        revenue: { label: t('dashboard.charts.revenueLabel'), color: 'hsl(var(--primary))' },
        expenses: { label: t('dashboard.charts.expensesLabel'), color: 'hsl(var(--destructive))' },
      }) satisfies ChartConfig,
    [t]
  );

  const chartId = useId().replace(/:/g, '');
  const revenueGradientId = `${chartId}-revenue`;
  const expenseGradientId = `${chartId}-expenses`;
  const glowFilterId = `${chartId}-glow`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="col-span-full lg:col-span-2 h-full"
    >
      <div className="h-full flex flex-col overflow-hidden relative group">
        {/* Ambient Background Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
        
        <div className="p-0 pb-6 space-y-1.5 relative z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                {t('dashboard.charts.revenueTitle')}
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_var(--primary)]" />
              </CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                {t('dashboard.charts.revenueSubtitle')}
              </CardDescription>
            </div>
            {typeof revenueTrend === 'number' && (
              <div
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-inner backdrop-blur-sm transition-all duration-300',
                  revenueTrend >= 0 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(52,211,153,0.3)]' 
                    : 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20'
                )}
              >
                {revenueTrend >= 0 ? '+' : ''}
                {revenueTrend}%
              </div>
            )}
          </div>
        </div>
        <div className="p-0 flex-1 min-h-0 relative z-10">
          {safeData.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5">
              <p className="text-sm text-muted-foreground">
                {t('dashboard.charts.revenueEmpty')}
              </p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={safeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <linearGradient id={revenueGradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id={expenseGradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={15}
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500 }}
                    tickFormatter={(value) => (typeof value === 'string' ? value.slice(0, 3) : value)}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 500 }}
                    tickFormatter={(value) =>
                      currencyFormatter
                        .format(value)
                        .replace('JOD', '')
                        .trim()
                    }
                  />
                  <ChartTooltip
                    cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
                    content={
                      <ChartTooltipContent
                        className="glass-panel border-white/10 bg-black/90 backdrop-blur-xl shadow-2xl"
                        formatter={(value) => (
                          <span className="font-mono font-bold text-foreground">
                            {currencyFormatter.format(Number(value))}
                          </span>
                        )}
                        indicator="line"
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    strokeWidth={3}
                    fill={`url(#${revenueGradientId})`}
                    filter={`url(#${glowFilterId})`}
                    animationDuration={1500}
                    activeDot={{ 
                      r: 6, 
                      strokeWidth: 4, 
                      stroke: 'rgba(0,0,0,0.5)', 
                      fill: 'var(--color-revenue)', 
                      className: 'animate-pulse' 
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="var(--color-expenses)"
                    strokeWidth={3}
                    fill={`url(#${expenseGradientId})`}
                    filter={`url(#${glowFilterId})`}
                    animationDuration={1500}
                    animationBegin={300}
                    activeDot={{ 
                      r: 6, 
                      strokeWidth: 4, 
                      stroke: 'rgba(0,0,0,0.5)', 
                      fill: 'var(--color-expenses)' 
                    }}
                  />
                  <ChartLegend content={<ChartLegendContent className="text-muted-foreground pt-4" />} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </div>
      </div>
    </motion.div>
  );
}
