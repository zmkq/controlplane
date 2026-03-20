'use client';

import { useId, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';

import { CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';

type GlowingBarDatum = {
  label: string;
  value: number;
};

interface GlowingBarChartProps {
  data?: GlowingBarDatum[];
  title: string;
  subtitle?: string;
  dataKey?: string;
  trendLabel?: string;
  trendDelta?: number | null;
  emptyMessage?: string;
}

export function GlowingBarChart({
  data = [],
  title,
  subtitle,
  dataKey = 'desktop',
  trendLabel,
  trendDelta,
  emptyMessage = 'No data available yet.',
}: GlowingBarChartProps) {
  const chartId = useId().replace(/:/g, '');
  const gradientId = `${chartId}-gradient`;

  const chartConfig = useMemo(
    () =>
      ({
        [dataKey]: {
          label: trendLabel ?? 'Value',
          color: 'hsl(var(--primary))',
        },
      }) satisfies ChartConfig,
    [dataKey, trendLabel]
  );

  const formattedData = (data ?? []).map((item) => ({
    month: item.label,
    [dataKey]: item.value,
  }));

  return (
    <div className="group relative flex h-full min-w-0 flex-col overflow-hidden">
       {/* Ambient Background Glow */}
       <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

      <div className="space-y-2 relative z-10 p-6 pb-0">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
          {title}
          {typeof trendDelta === 'number' && (
            <Badge
              variant="outline"
              className={`border-none text-xs font-semibold backdrop-blur-sm ${
                trendDelta >= 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-destructive/15 text-destructive'
              }`}
            >
              <TrendingUp className="mr-1 h-3.5 w-3.5" />
              {trendDelta >= 0 ? '+' : ''}
              {trendDelta.toFixed(1)}%
            </Badge>
          )}
        </CardTitle>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <div className="min-h-[250px] md:h-[320px] flex-1 relative z-10 p-6 pt-2">
        {formattedData.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border/60 p-4">
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart accessibilityLayer data={formattedData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                  </linearGradient>
                  <filter id="glow" height="130%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                    <feOffset dx="0" dy="0" result="offsetblur" />
                    <feFlood floodColor="var(--color-primary)" floodOpacity="0.5" />
                    <feComposite in2="offsetblur" operator="in" />
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value: string) => value.slice(0, 4)}
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                />
                <ChartTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                  content={
                    <ChartTooltipContent 
                      hideLabel 
                      className="glass-panel border-white/10 bg-black/90 backdrop-blur-xl"
                    />
                  } 
                />
                <Bar 
                  dataKey={dataKey} 
                  fill={`url(#${gradientId})`} 
                  radius={[6, 6, 0, 0]}
                  filter="url(#glow)"
                  animationDuration={1500}
                >
                  {formattedData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#${gradientId})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}
