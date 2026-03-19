'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';

interface PerformanceChartProps {
  data: {
    name: string;
    revenue: number;
    expenses: number;
  }[];
  className?: string;
}

export function PerformanceChart({ data, className }: PerformanceChartProps) {
  const { t } = useTranslations();

  const formattedData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      profit: item.revenue - item.expenses,
    }));
  }, [data]);

  return (
    <div className={cn('h-full w-full flex flex-col', className)}>
      <div className="mb-4 flex items-center justify-between px-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t('dashboard.charts.performance', 'Performance')}
          </h3>
          <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
            {t('dashboard.charts.revenueVsExpenses', 'Revenue vs Burn')}
          </p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px] sm:min-h-[200px] select-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorBurn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
              </linearGradient>
              <filter id="glow" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                <feColorMatrix
                  in="blur"
                  type="matrix"
                  values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                  result="glow"
                />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              tickFormatter={(value) => `${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
              width={30}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-xl border border-white/10 bg-black/80 px-4 py-3 shadow-xl backdrop-blur-md">
                      <p className="mb-2 text-xs font-semibold text-white/50">{label}</p>
                      <div className="space-y-1">
                        {payload.map((entry: any) => (
                          <div key={entry.name} className="flex items-center gap-2 text-xs">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-white/70 capitalize">
                              {entry.name}:
                            </span>
                            <span className="font-mono text-white">
                              JOD {entry.value.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Burn"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorBurn)"
              strokeWidth={3}
              filter="url(#glow)"
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorRevenue)"
              strokeWidth={3}
              filter="url(#glow)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
