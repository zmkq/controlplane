'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, ArrowUpRight, Activity } from 'lucide-react';

interface KpiProps {
  label: string;
  value: string | number;
  trend?: string;
  className?: string;
}

export function RevenueCard({ label, value, trend, className }: KpiProps) {
  return (
    <div className={cn('flex h-full flex-col justify-between', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        {trend && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </span>
        )}
      </div>

      <div className="relative mt-4">
        {/* Background Sparkline (Decorative) */}
        <svg
          className="absolute bottom-0 left-0 -z-10 h-16 w-full opacity-20"
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
        >
          <path
            d="M0 35 Q 20 30, 40 38 T 100 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary"
          />
          <path
            d="M0 35 Q 20 30, 40 38 T 100 10 V 40 H 0 Z"
            fill="currentColor"
            className="text-primary/20"
          />
        </svg>

        <p className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          <span className="text-holographic">
            {value}
          </span>
        </p>
      </div>
    </div>
  );
}

export function ProfitCard({ label, value, trend, className }: KpiProps) {
  return (
    <div className={cn('flex h-full flex-col justify-between', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        <div className="h-8 w-8 rounded-full border-2 border-primary/20 p-0.5">
           <div className="h-full w-full rounded-full bg-primary/20" />
        </div>
      </div>
      
      <div>
        <p className="text-3xl font-bold text-foreground sm:text-4xl">
          <span className="text-holographic">{value}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
           <span className="text-emerald-400">{trend}</span> vs last month
        </p>
      </div>
    </div>
  );
}

export function LiveRadarCard({ label, value, className }: KpiProps) {
  return (
    <div className={cn('relative flex h-full flex-col items-center justify-center overflow-hidden text-center', className)}>
      {/* Radar Animation */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className="h-32 w-32 animate-[spin_4s_linear_infinite] rounded-full border border-t-primary border-r-transparent border-b-transparent border-l-transparent" />
        <div className="absolute h-24 w-24 rounded-full border border-white/10" />
        <div className="absolute h-16 w-16 rounded-full border border-white/10" />
      </div>

      <div className="relative z-10">
        <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Activity className="h-4 w-4 text-primary animate-pulse" />
        </div>
        <p className="text-3xl font-bold text-foreground">
          <span className="text-holographic">{value}</span>
        </p>
        <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}
