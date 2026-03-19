'use client';

import { useId, useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import { CardTitle } from '@/components/ui/card';

type RadarDatum = {
  label: string;
  value: number;
};

interface RadarChartComponentProps {
  data?: RadarDatum[];
  title: string;
  subtitle?: string;
  maxValue?: number;
  emptyMessage?: string;
}

export function RadarChartComponent({
  data = [],
  title,
  subtitle,
  maxValue = 100,
  emptyMessage = 'Add partner data to visualize performance.',
}: RadarChartComponentProps) {
  const chartId = useId().replace(/:/g, '');
  const gradientId = `${chartId}-radar-gradient`;
  const glowId = `${chartId}-radar-glow`;

  const safeData = useMemo(() => {
    return (data ?? []).map((item) => ({
      subject: item.label,
      value: item.value,
    }));
  }, [data]);

  return (
    <div className="h-full flex flex-col overflow-hidden relative group">
       {/* Ambient Background Glow */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-accent/20 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

      <div className="pb-3 relative z-10 p-6 pb-0">
        <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
        {subtitle ? (
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <div className="p-0 relative z-10 p-6 pt-0 flex-1">
        {safeData.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground m-4">
            {emptyMessage}
          </p>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={safeData}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.2} />
                  </linearGradient>
                  <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 500 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, maxValue]}
                  tickCount={5}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  fillOpacity={0.6}
                  filter={`url(#${glowId})`}
                  isAnimationActive={true}
                  animationDuration={1500}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
