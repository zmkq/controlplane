'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Label } from 'recharts';
import type { PieLabelRenderProps, LabelProps } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

type DonutDatum = {
  key: string;
  label: string;
  value: number;
};

interface DonutChartComponentProps {
  data?: DonutDatum[];
  title: string;
  subtitle?: string;
  emptyMessage?: string;
}

const COLOR_BUCKETS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

export function DonutChartComponent({
  data = [],
  title,
  subtitle,
  emptyMessage = 'Nothing to visualize yet.',
}: DonutChartComponentProps) {
  const safeData = (data ?? []).filter((item) => typeof item.value === 'number');
  const total = safeData.reduce((sum, item) => sum + item.value, 0);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    safeData.forEach((item, index) => {
      config[item.key] = {
        label: item.label,
        color: COLOR_BUCKETS[index % COLOR_BUCKETS.length],
      };
    });
    return config;
  }, [safeData]);

  return (
    <Card className="rounded-3xl border border-border/70 bg-background/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent className="p-0">
        {safeData.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Pie
                  data={safeData}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                  strokeWidth={4}
                >
                  {safeData.map((entry) => (
                    <Cell key={entry.key} fill={`var(--color-${entry.key})`} stroke="var(--background)" />
                  ))}
                  <Label position="center" content={createCenterLabel(total)} />
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {safeData.map((item) => (
                <span key={`legend-${item.key}`} className="inline-flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: `var(--color-${item.key})` }}
                  />
                  {item.label}
                </span>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function createCenterLabel(total: number): LabelProps['content'] {
  return (labelProps) => {
    const { cx, cy } = labelProps as PieLabelRenderProps;
    if (typeof cx !== 'number' || typeof cy !== 'number') {
      return null;
    }
    return (
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="fill-foreground">
        <tspan className="text-xs uppercase text-muted-foreground" x={cx} dy="-0.4em">
          Total
        </tspan>
        <tspan className="text-2xl font-semibold" x={cx} dy="1.2em">
          {total.toFixed(0)}
        </tspan>
      </text>
    );
  };
}
