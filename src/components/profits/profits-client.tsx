'use client';

import { ProfitStory } from './profit-story';
import { useTranslations } from '@/lib/i18n';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Receipt, Wallet, Info, PieChart as PieChartIcon, BarChart3, RefreshCw } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,   
} from 'recharts';


type ProfitsClientProps = {
  totalRevenue: number;
  totalCogs: number;
  totalExpenses: number;
  totalOrderExpenses: number;
  netProfit: number;
  profitMargin: number;
  monthlyData: Array<{
    month: string;
    revenue: number;
    cogs: number;
    expenses: number;
    profit: number;
  }>;
  expensesByCategory: Array<{
    category: string;
    _sum: { amount: number | null };
  }>;
  orderExpensesByCategory: Array<{
    category: string;
    _sum: { amount: number | null };
  }>;
  salesCount: number;
  recentSales: Array<{
    id: string;
    orderNo: string;
    customerName: string;
    date: Date;
    revenue: number;
    profit: number;
    margin: number;
  }>;
  storySales: Array<{
    id: string;
    orderNo: string;
    revenue: number;
    profit: number;
  }>;
  currentPeriod: string;
};

const COLORS = ['#dbec0a', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function ProfitsClient({
  totalRevenue,
  totalCogs,
  totalExpenses,
  totalOrderExpenses,
  netProfit,
  profitMargin,
  monthlyData,
  expensesByCategory,
  salesCount,
  recentSales,
  storySales,
  currentPeriod,
}: ProfitsClientProps) {
  const { t } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldAutoOpenStory = searchParams.get('showStory') === 'true';
  const [showCustomDates, setShowCustomDates] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isStoryOpen, setIsStoryOpen] = useState(shouldAutoOpenStory);

  useEffect(() => {
    if (shouldAutoOpenStory) {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('showStory');
      const nextQuery = newParams.toString();
      router.replace(`/profits${nextQuery ? `?${nextQuery}` : ''}`, {
        scroll: false,
      });
    }
  }, [searchParams, router, shouldAutoOpenStory]);

  const periodOptions = [
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' },
    { value: 'year', label: 'Last Year' },
    { value: 'all', label: 'All Time' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const handlePeriodChange = (period: string) => {
    if (period === 'custom') {
      setShowCustomDates(true);
      return;
    }
    
    setShowCustomDates(false);
    const params = new URLSearchParams();
    if (period !== 'all') {
      params.set('period', period);
    }
    router.push(`/profits${params.toString() ? `?${params.toString()}` : ''}`);
    setIsStoryOpen(true);
  };

  const handleCustomDateApply = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    router.push(`/profits${params.toString() ? `?${params.toString()}` : ''}`);
    setIsStoryOpen(true);
  };

  const handleClearDates = () => {
    setDateFrom('');
    setDateTo('');
    setShowCustomDates(false);
    router.push('/profits');
  };

  // Prepare data for charts
  const chartData = [...monthlyData].reverse();
  const pieData = expensesByCategory.map((item) => ({
    name: item.category.charAt(0) + item.category.slice(1).toLowerCase().replace('_', ' '),
    value: item._sum.amount ?? 0,
  })).filter(item => item.value > 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <>
      <ProfitStory 
        isOpen={isStoryOpen} 
        onClose={() => setIsStoryOpen(false)}
        period={currentPeriod}
        data={{
          revenue: totalRevenue,
          cogs: totalCogs,
          expenses: totalExpenses,
          orderExpenses: totalOrderExpenses,
          netProfit: netProfit,
          salesCount: salesCount,
          storySales: storySales,
        }}
      />
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto w-full max-w-[1600px] space-y-8 px-4 pb-24 pt-8 sm:px-6 lg:px-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-3 w-3" />
              {t('profits.backLink', 'Dashboard')}
            </Link>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              <span className="text-foreground">{t('profits.title', 'Profit')}</span>{' '}
              <span className="text-premium-gradient">{t('profits.titleHighlight', 'Analysis')}</span>
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground/80">
              {t('profits.subtitle', 'Comprehensive breakdown of revenue, costs, expenses, and net profit with calculation methodology')}
            </p>
          </div>
          
          {/* Period Filter & Refresh Button */}
          <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
            {showCustomDates ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
              >
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-muted-foreground">-</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={handleCustomDateApply}
                  className="rounded-xl bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/20"
                >
                  Apply
                </button>
                <button
                  onClick={handleClearDates}
                  className="rounded-xl bg-white/5 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-white/10 hover:text-foreground"
                >
                  Cancel
                </button>
              </motion.div>
            ) : (
              <select
                value={currentPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-black text-foreground">
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            <RefreshButton />
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div variants={itemVariants} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label={t('profits.metrics.totalRevenue', 'Total Revenue')}
            value={`JOD ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<DollarSign className="h-5 w-5" />}
            trend={profitMargin > 30 ? 'up' : profitMargin > 15 ? 'neutral' : 'down'}
            description={t('profits.metrics.totalRevenueDesc', 'Sum of all sales')}
            color="text-primary"
          />
          <MetricCard
            label={t('profits.metrics.totalCogs', 'Total COGS')}
            value={`JOD ${totalCogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<Receipt className="h-5 w-5" />}
            trend="neutral"
            description={t('profits.metrics.totalCogsDesc', 'Cost of goods sold')}
            color="text-orange-400"
          />
          <MetricCard
            label={t('profits.metrics.totalExpenses', 'Total Expenses')}
            value={`JOD ${(totalExpenses + totalOrderExpenses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<Wallet className="h-5 w-5" />}
            trend="neutral"
            description={t('profits.metrics.totalExpensesDesc', 'All business expenses')}
            color="text-orange-400"
            tooltip="Includes both general expenses and specific order expenses (e.g. packaging, extra fees)"
          />
          <MetricCard
            label={t('profits.metrics.netProfit', 'Net Profit')}
            value={`JOD ${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<TrendingUp className="h-5 w-5" />}
            trend={netProfit > 0 ? 'up' : 'down'}
            description={`${profitMargin.toFixed(1)}% ${t('profits.metrics.margin', 'margin')}`}
            color={netProfit > 0 ? 'text-emerald-400' : 'text-destructive'}
            isHighlight
            tooltip="Net Profit = Total Revenue - Total COGS - Total Expenses (General + Order Specific)"
          />
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Chart Section */}
          <motion.div variants={itemVariants} className="glass-panel col-span-2 flex flex-col rounded-[2rem] p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">{t('profits.monthly.title', 'Performance Trend')}</h2>
                <p className="text-sm text-muted-foreground">Revenue vs Net Profit (Last 3 Months)</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dbec0a" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#dbec0a" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `JOD ${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      borderColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: '12px',
                      backdropFilter: 'blur(10px)'
                    }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => [`JOD ${value.toFixed(2)}`, '']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#dbec0a" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    name="Revenue"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorProfit)" 
                    name="Net Profit"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Expenses Breakdown */}
          <motion.div variants={itemVariants} className="glass-panel flex flex-col rounded-[2rem] p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">{t('profits.expenses.title', 'Expenses')}</h2>
                <p className="text-sm text-muted-foreground">Breakdown by Category</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                <PieChartIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            <div className="relative flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      borderColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: '12px',
                      backdropFilter: 'blur(10px)'
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-foreground">
                  JOD {(totalExpenses + totalOrderExpenses).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Calculation Breakdown */}
        <motion.div variants={itemVariants} className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground">{t('profits.breakdown.title', 'Profit Calculation')}</h2>
            <p className="text-sm text-muted-foreground">Step-by-step breakdown of your net profit</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CalcStep 
              label="Total Revenue" 
              value={totalRevenue} 
              color="text-primary" 
              icon="+"
            />
            <CalcStep 
              label="Cost of Goods" 
              value={totalCogs} 
              color="text-orange-400" 
              icon="-"
              isNegative
            />
            <CalcStep 
              label="Total Expenses" 
              value={totalExpenses + totalOrderExpenses} 
              color="text-red-400" 
              icon="-"
              isNegative
            />
            <div className="relative flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
              <div className="absolute -left-[23px] flex h-6 w-6 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500 text-xs font-bold text-black">
                =
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-foreground">Net Profit</p>
              </div>
              <p className="font-mono text-sm font-bold text-emerald-400">
                JOD {netProfit.toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

function MetricCard({
  label,
  value,
  icon,
  trend,
  description,
  color = 'text-foreground',
  isHighlight = false,
  tooltip,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
  description: string;
  color?: string;
  isHighlight?: boolean;
  tooltip?: string;
}) {
  return (
    <div className={`glass-panel group relative overflow-hidden rounded-[1.5rem] p-5 transition-all hover:bg-white/[0.07] ${isHighlight ? 'border-primary/30 bg-primary/5' : ''}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
          {tooltip && (
            <div className="group/tooltip relative">
              <Info className="h-3 w-3 text-muted-foreground/50 transition-colors hover:text-primary" />
              <div className="absolute bottom-full left-1/2 mb-2 hidden w-48 -translate-x-1/2 rounded-lg border border-white/10 bg-black/90 p-2 text-xs text-white backdrop-blur-md group-hover/tooltip:block z-50">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
          isHighlight ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'
        }`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      {isHighlight && (
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
      )}
    </div>
  );
}

function CalcStep({
  label,
  value,
  color,
  icon,
  isNegative,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
  isNegative?: boolean;
}) {
  return (
    <div className="relative flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3 transition-colors hover:bg-white/10">
      <div className="absolute -left-[23px] flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black text-xs font-bold text-muted-foreground">
        {icon}
      </div>
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
      <p className={`font-mono text-sm font-bold ${color}`}>
        {isNegative ? '-' : ''} JOD {value.toFixed(2)}
      </p>
    </div>
  );
}

function RefreshButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    // Reset the spinning state after animation
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary disabled:opacity-50"
    >
      <RefreshCw className={`h-4 w-4 transition-transform ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
      <span className="hidden sm:inline">Refresh Data</span>
      <span className="sm:hidden">Refresh</span>
    </button>
  );
}
