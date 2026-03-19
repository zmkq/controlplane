'use client';

import { useId, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { motion } from 'framer-motion';

interface BarChartProps {
  data?: { name: string; [key: string]: number | string }[];
  title: string;
  subtitle?: string;
  dataKey: string;
  seriesLabel?: string;
  barColor?: string;
  emptyMessage?: string;
}

export function BarChartComponent({
  data = [],
  title,
  subtitle,
  dataKey = 'value',
  seriesLabel = 'Value',
  barColor = 'hsl(var(--primary))',
  emptyMessage = 'No data available for this chart yet.',
}: BarChartProps) {
  const patternId = useId().replace(/:/g, '') + '-dots';

  const chartConfig = useMemo(
    () =>
      ({
        [dataKey]: {
          label: seriesLabel,
          color: barColor,
        },
      }) satisfies ChartConfig,
    [barColor, dataKey, seriesLabel]
  );

  const safeData = Array.isArray(data) ? data : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="col-span-full lg:col-span-2"
    >
      <Card className="glass-panel rounded-[2rem] border border-white/10 bg-black/40 p-6 backdrop-blur-md shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]">
        <CardHeader className="p-0 pb-6">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold text-foreground tracking-tight">{title}</CardTitle>
            {subtitle && <CardDescription className="text-xs uppercase tracking-widest text-muted-foreground font-medium">{subtitle}</CardDescription>}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {safeData.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5">
              <p className="text-sm text-muted-foreground">
                {emptyMessage}
              </p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="aspect-auto h-[320px] w-full">
              <BarChart accessibilityLayer data={safeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <pattern id={patternId} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                    <circle className="text-white/10" cx="1" cy="1" r="1" fill="currentColor" />
                  </pattern>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-value)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                  tickFormatter={(value) => (typeof value === 'string' ? value.slice(0, 8) : value)}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                  tickFormatter={(value) => Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)}
                />
                <ChartTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                  content={<ChartTooltipContent hideLabel className="glass-panel border-white/10 bg-black/80 backdrop-blur-xl" />} 
                />
                <Bar 
                  dataKey={dataKey} 
                  fill="url(#barGradient)" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={42}
                  className="stroke-white/10 stroke-1"
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
