'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { generatePnlReport } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LineChartComponent } from '@/components/charts/LineChartComponent';
import { BarChartComponent } from '@/components/charts/BarChartComponent';
import { cn } from '@/lib/utils';
import { Loader2, RefreshCw, Calendar } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';

type ReportSnapshot = Awaited<ReturnType<typeof generatePnlReport>>;

const matrixColumns = Array.from({ length: 20 }, (_, index) => ({
  left: `${4 + index * 4.6}%`,
  duration: `${6 + (index % 5)}s`,
  delay: `${(index % 4) * 0.8}s`,
  opacity: 0.12 + (index % 5) * 0.08,
  stream: Array.from({ length: 30 }, (_, row) =>
    (row + index) % 2 === 0 ? '1' : '0',
  ).join('\n'),
}));

export default function PnlReportPage() {
  const { t } = useTranslations();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [report, setReport] = useState<ReportSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const monthOptions = [
    { value: 1, label: t('common.months.jan', 'Jan') },
    { value: 2, label: t('common.months.feb', 'Feb') },
    { value: 3, label: t('common.months.mar', 'Mar') },
    { value: 4, label: t('common.months.apr', 'Apr') },
    { value: 5, label: t('common.months.may', 'May') },
    { value: 6, label: t('common.months.jun', 'Jun') },
    { value: 7, label: t('common.months.jul', 'Jul') },
    { value: 8, label: t('common.months.aug', 'Aug') },
    { value: 9, label: t('common.months.sep', 'Sep') },
    { value: 10, label: t('common.months.oct', 'Oct') },
    { value: 11, label: t('common.months.nov', 'Nov') },
    { value: 12, label: t('common.months.dec', 'Dec') },
  ];

  const fetchReport = useCallback((targetMonth: number, targetYear: number) => {
    startTransition(async () => {
      try {
        const snapshot = await generatePnlReport(targetMonth, targetYear);
        setReport(snapshot);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(t('reports.pnl.error', 'Unable to generate report. Please try again.'));
      }
    });
  }, [t]);

  useEffect(() => {
    fetchReport(month, year);
  }, [fetchReport, month, year]);

  const lineData = useMemo(() => {
    return (
      report?.dailyRevenue?.map((item) => ({
        name: item.name,
        revenue: item.revenue,
        expenses: item.expenses,
      })) ?? []
    );
  }, [report]);

  const expenseData = useMemo(() => report?.expenseBreakdown ?? [], [report]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Data Rain Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        {matrixColumns.map((column, i) => (
          <div
            key={i}
            className="absolute top-0 text-xs font-mono text-emerald-500 whitespace-nowrap animate-matrix-rain"
            style={{
              left: column.left,
              animationDuration: column.duration,
              animationDelay: column.delay,
              opacity: column.opacity,
            }}
          >
            {column.stream}
          </div>
        ))}
      </div>

      <div className="relative z-10 space-y-8 px-4 pb-24 pt-8 sm:px-6 lg:px-10">
        {/* Header Section */}
        <section className="glass-panel rounded-[2.5rem] border border-white/10 bg-black/40 px-8 py-8 backdrop-blur-xl shadow-[0_0_50px_-20px_rgba(0,0,0,0.7)]">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <RefreshCw className={cn("h-5 w-5", isPending && "animate-spin")} />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400/80">
                  {t('reports.pnl.oracle', 'The Oracle')}
                </p>
              </div>
              
              <div>
                <h1 className="text-4xl font-bold text-foreground tracking-tight sm:text-5xl mb-2">
                  {t('reports.pnl.title', 'Profit & Loss')}
                </h1>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {t('reports.pnl.subtitle', 'Deep dive into financial performance. Analyze revenue streams, cost structures, and net margins with precision.')}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 px-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="bg-transparent text-sm font-medium text-foreground outline-none cursor-pointer hover:text-primary transition-colors"
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-black text-foreground">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="h-auto w-px bg-white/10 hidden sm:block" />
              
              <div className="flex items-center gap-2 px-2">
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="h-8 w-20 bg-transparent border-none text-sm font-medium text-foreground p-0 focus-visible:ring-0 text-right sm:text-left"
                />
              </div>

              <Button 
                onClick={() => fetchReport(month, year)} 
                disabled={isPending}
                className="brand-glow bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('reports.pnl.runSimulation', 'Run Simulation')}
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              {error}
            </div>
          )}
        </section>

        {/* KPI Grid */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard 
            label={t('reports.pnl.totalRevenue', 'Total Revenue')} 
            value={`${t('common.currency.jod', 'JOD')} ${(report?.totalRevenue ?? 0).toFixed(2)}`} 
            trend="+12.5%"
            trendPositive={true}
            delay={0.1}
          />
          <MetricCard 
            label={t('reports.pnl.cogs', 'COGS')} 
            value={`${t('common.currency.jod', 'JOD')} ${(report?.totalCogs ?? 0).toFixed(2)}`} 
            trend="-2.1%"
            trendPositive={true}
            delay={0.2}
          />
          <MetricCard 
            label={t('reports.pnl.opex', 'OpEx')} 
            value={`${t('common.currency.jod', 'JOD')} ${(report?.totalExpenses ?? 0).toFixed(2)}`} 
            trend="+5.4%"
            trendPositive={false}
            delay={0.3}
          />
          <MetricCard
            label={t('reports.pnl.netProfit', 'Net Profit')}
            value={`${t('common.currency.jod', 'JOD')} ${(report?.netProfit ?? 0).toFixed(2)}`}
            sublabel={`${(report?.marginPercent ?? 0).toFixed(1)}% ${t('reports.pnl.margin', 'Margin')}`}
            highlight
            delay={0.4}
          />
        </section>

        {/* Charts Section */}
        <section className="grid gap-8 lg:grid-cols-2">
          <LineChartComponent data={lineData.length ? lineData : [{ name: 'D1', revenue: 0, expenses: 0 }]} />
          {expenseData.length ? (
            <BarChartComponent 
              data={expenseData} 
              title={t('reports.pnl.expenseMix', 'Expense Mix')} 
              subtitle={t('reports.pnl.breakdown', 'Breakdown by category')}
              dataKey="value" 
              barColor="hsl(var(--destructive))" 
            />
          ) : (
            <PlaceholderCard title={t('reports.pnl.expenseMix', 'Expense Mix')} />
          )}
        </section>

        {/* Summary Panel */}
        <section className="glass-panel rounded-[2rem] border border-white/10 bg-black/40 px-8 py-8 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-bold">{t('reports.pnl.executiveSummary', 'Executive Summary')}</p>
              <h2 className="text-2xl font-bold text-foreground mt-2">{t('reports.pnl.monthGlance', 'Month at a Glance')}</h2>
            </div>
            <div className="flex gap-4 text-sm font-medium text-muted-foreground bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <span className="text-foreground">{report?.orders ?? 0}</span> {t('reports.pnl.ordersProcessed', 'Orders Processed')}
              <span className="text-white/20">|</span>
              <span className={cn((report?.marginPercent ?? 0) >= 0 ? "text-emerald-400" : "text-destructive")}>
                {(report?.marginPercent ?? 0).toFixed(1)}%
              </span> {t('reports.pnl.grossMargin', 'Gross Margin')}
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <SummaryRow 
              label={t('reports.pnl.revenueVsCogs', 'Revenue vs COGS')} 
              value={`${t('common.currency.jod', 'JOD')} ${(report?.totalRevenue ?? 0).toFixed(2)}`} 
              subValue={`${t('common.currency.jod', 'JOD')} ${(report?.totalCogs ?? 0).toFixed(2)}`}
            />
            <SummaryRow 
              label={t('reports.pnl.operatingBurn', 'Operating Burn')} 
              value={`${t('common.currency.jod', 'JOD')} ${(report?.totalExpenses ?? 0).toFixed(2)}`} 
              subValue={t('reports.pnl.totalOpex', 'Total OpEx')}
            />
          </div>
        </section>
      </div>
      
      <style jsx global>{`
        @keyframes matrix-rain {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .animate-matrix-rain {
          animation-name: matrix-rain;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}

function MetricCard({ 
  label, 
  value, 
  sublabel, 
  trend, 
  trendPositive, 
  highlight,
  delay = 0 
}: { 
  label: string; 
  value: string; 
  sublabel?: string; 
  trend?: string;
  trendPositive?: boolean;
  highlight?: boolean;
  delay?: number;
}) {
  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-[2rem] border p-6 transition-all duration-500 hover:-translate-y-1",
        highlight 
          ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]" 
          : "glass-panel border-white/10 bg-black/40 hover:bg-white/5 hover:border-white/20"
      )}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        {trend && (
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full",
            trendPositive 
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
              : "bg-destructive/10 text-destructive border border-destructive/20"
          )}>
            {trend}
          </span>
        )}
      </div>
      
      <p className={cn(
        "text-2xl sm:text-3xl font-bold tracking-tight",
        highlight ? "text-emerald-400 text-shadow-glow" : "text-foreground"
      )}>
        {value}
      </p>
      
      {sublabel && (
        <p className={cn(
          "mt-2 text-xs font-medium",
          highlight ? "text-emerald-400/70" : "text-muted-foreground"
        )}>
          {sublabel}
        </p>
      )}
      
      {/* Background Glow Effect */}
      <div className={cn(
        "absolute -right-10 -bottom-10 h-32 w-32 rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-50 opacity-0",
        highlight ? "bg-emerald-500/20" : "bg-white/5"
      )} />
    </div>
  );
}

function SummaryRow({ label, value, subValue }: { label: string; value: string; subValue: string }) {
  return (
    <div className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-6 py-5 transition-colors hover:bg-white/10 hover:border-white/10">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">{label}</span>
        <span className="text-lg font-bold text-foreground">{value}</span>
      </div>
      <div className="text-right">
        <span className="text-xs font-medium text-muted-foreground/50 block mb-1">Secondary</span>
        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{subValue}</span>
      </div>
    </div>
  );
}

function PlaceholderCard({ title }: { title: string }) {
  const { t } = useTranslations();
  return (
    <div className="glass-panel rounded-[2rem] border border-white/10 bg-black/40 p-8 flex flex-col items-center justify-center text-center h-[320px]">
      <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <Loader2 className="h-5 w-5 text-muted-foreground animate-spin-slow" />
      </div>
      <p className="text-lg font-bold text-foreground mb-2">{title}</p>
      <p className="text-sm text-muted-foreground max-w-xs">
        {t('reports.pnl.offline', 'Data stream offline. Initiate transaction volume to visualize this metric.')}
      </p>
    </div>
  );
}
