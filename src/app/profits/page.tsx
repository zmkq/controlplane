import { prisma } from '@/lib/prisma';
import { ProfitsClient } from '@/components/profits/profits-client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SearchParams = {
  period?: string;
  dateFrom?: string;
  dateTo?: string;
};

export default async function ProfitsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const period = params.period || 'all';
  const customDateFrom = params.dateFrom;
  const customDateTo = params.dateTo;
  
  // Calculate date range based on period or custom dates
  const now = new Date();
  let startDate: Date | undefined;
  let endDate: Date | undefined;
  
  // Custom date range takes precedence
  if (customDateFrom || customDateTo) {
    if (customDateFrom) {
      startDate = new Date(customDateFrom);
      startDate.setHours(0, 0, 0, 0);
    }
    if (customDateTo) {
      endDate = new Date(customDateTo);
      endDate.setHours(23, 59, 59, 999);
    }
  } else {
    // Use preset periods
    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
      default:
        startDate = undefined;
        break;
    }
  }

  // Build date filter for queries
  const dateFilter: any = {};
  if (startDate && endDate) {
    dateFilter.date = { gte: startDate, lte: endDate };
  } else if (startDate) {
    dateFilter.date = { gte: startDate };
  } else if (endDate) {
    dateFilter.date = { lte: endDate };
  }

  const orderDateFilter = Object.keys(dateFilter).length > 0
    ? { saleOrder: dateFilter }
    : {};

  // Fetch data with period filter
  // Fetch all-time data
  const [
    totalRevenueResult,
    totalCogsResult,
    totalExpensesResult,
    totalOrderExpensesResult,
    salesCount,
  ] = await Promise.all([
    prisma.saleOrderLine.aggregate({
      where: orderDateFilter,
      _sum: { lineTotal: true },
    }),
    prisma.saleOrderLine.aggregate({
      where: orderDateFilter,
      _sum: { cogs: true },
    }),
    prisma.expense.aggregate({
      where: dateFilter,
      _sum: { amount: true },
    }),
    prisma.orderExpense.aggregate({
      where: orderDateFilter,
      _sum: { amount: true },
    }),
    prisma.saleOrder.count({
      where: dateFilter,
    }),
  ]);

  const totalRevenue = Number(totalRevenueResult._sum.lineTotal ?? 0);
  const totalCogs = Number(totalCogsResult._sum.cogs ?? 0);
  const totalExpenses = Number(totalExpensesResult._sum.amount ?? 0);
  const totalOrderExpenses = Number(totalOrderExpensesResult._sum.amount ?? 0);
  const netProfit = totalRevenue - totalCogs - totalExpenses - totalOrderExpenses;
  
  // 1. Fetch Overrides for All Time Adjustment
  const overriddenOrders = await prisma.saleOrder.findMany({
    where: {
      ...dateFilter,
      OR: [
        { customCostOverride: { not: null } },
        { customProfitOverride: { not: null } },
      ],
      status: { notIn: ['CANCELED', 'RETURNED', 'DRAFT'] },
    },
    include: {
      lines: { select: { cogs: true, lineTotal: true } },
      orderExpenses: { select: { amount: true } },
    },
  });

  let cogsAdjustment = 0;

  for (const order of overriddenOrders) {
    const revenue = order.lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const stdCogs = order.lines.reduce((sum, line) => sum + (line.cogs || 0), 0);
    const expenses = order.orderExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const actualCost = order.customCostOverride ?? stdCogs;
    const actualProfit = order.customProfitOverride ?? (revenue - actualCost - expenses);
    
    // We adjust COGS to make the profit equation work: Profit = Rev - COGS - Exp
    // So: Implied COGS = Rev - Exp - Actual Profit
    const impliedCogs = revenue - expenses - actualProfit;
    cogsAdjustment += (impliedCogs - stdCogs);
  }

  const adjustedTotalCogs = totalCogs + cogsAdjustment;
  const adjustedNetProfit = totalRevenue - adjustedTotalCogs - totalExpenses - totalOrderExpenses;
  const profitMargin = totalRevenue > 0 ? (adjustedNetProfit / totalRevenue) * 100 : 0;

  // Monthly breakdown (last 3 months)
  const monthlyData = [];
  const today = new Date();
  
  for (let i = 2; i >= 0; i--) {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);

    const [revenue, cogs, expenses, orderExpenses] = await Promise.all([
      prisma.saleOrderLine.aggregate({
        _sum: { lineTotal: true },
        where: {
          saleOrder: {
            date: { gte: monthStart, lt: monthEnd },
          },
        },
      }),
      prisma.saleOrderLine.aggregate({
        _sum: { cogs: true },
        where: {
          saleOrder: {
            date: { gte: monthStart, lt: monthEnd },
          },
        },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: {
          date: { gte: monthStart, lt: monthEnd },
        },
      }),
      prisma.orderExpense.aggregate({
        _sum: { amount: true },
        where: {
          saleOrder: {
            date: { gte: monthStart, lt: monthEnd },
          },
        },
      }),
    ]);

    const monthRevenue = Number(revenue._sum.lineTotal ?? 0);
    const monthCogs = Number(cogs._sum.cogs ?? 0);
    const monthExpenses = Number(expenses._sum.amount ?? 0);
    const monthOrderExpenses = Number(orderExpenses._sum.amount ?? 0);

    // Fetch monthly overrides
    const monthOverrides = await prisma.saleOrder.findMany({
      where: {
        date: { gte: monthStart, lt: monthEnd },
        OR: [
          { customCostOverride: { not: null } },
          { customProfitOverride: { not: null } },
        ],
        status: { notIn: ['CANCELED', 'RETURNED', 'DRAFT'] },
      },
      include: {
        lines: { select: { cogs: true, lineTotal: true } },
        orderExpenses: { select: { amount: true } },
      },
    });

    let monthCogsAdj = 0;
    for (const order of monthOverrides) {
      const r = order.lines.reduce((sum, line) => sum + line.lineTotal, 0);
      const c = order.lines.reduce((sum, line) => sum + (line.cogs || 0), 0);
      const e = order.orderExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      
      const ac = order.customCostOverride ?? c;
      const ap = order.customProfitOverride ?? (r - ac - e);
      const ic = r - e - ap;
      monthCogsAdj += (ic - c);
    }

    const adjMonthCogs = monthCogs + monthCogsAdj;
    const monthProfit = monthRevenue - adjMonthCogs - monthExpenses - monthOrderExpenses;

    monthlyData.push({
      month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
      revenue: monthRevenue,
      cogs: adjMonthCogs,
      expenses: monthExpenses + monthOrderExpenses,
      profit: monthProfit,
    });
  }

  // Expense breakdown
  const expensesByCategory = await prisma.expense.groupBy({
    by: ['category'],
    where: dateFilter,
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
  });

  const orderExpensesByCategory = await prisma.orderExpense.groupBy({
    by: ['category'],
    where: orderDateFilter,
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
  });

  // Recent Sales Profit Analysis
  const recentSalesRaw = await prisma.saleOrder.findMany({
    take: 8,
    orderBy: { date: 'desc' },
    where: { 
      ...dateFilter,
      status: { notIn: ['CANCELED', 'RETURNED', 'DRAFT'] },
    },
    include: {
      customer: { select: { name: true } },
      lines: { select: { lineTotal: true, cogs: true } },
      orderExpenses: { select: { amount: true } },
    },
  });

  const recentSales = recentSalesRaw.map(sale => {
    const revenue = sale.lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const cogs = sale.lines.reduce((sum, line) => sum + (line.cogs || 0), 0);
    const expenses = sale.orderExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    const actualCost = sale.customCostOverride ?? cogs;
    const profit = sale.customProfitOverride ?? (revenue - actualCost - expenses);
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      id: sale.id,
      orderNo: sale.orderNo,
      customerName: sale.customer.name,
      date: sale.date,
      revenue,
      profit,
      margin,
    };
  });

  // Fetch sales for Profit Story (limit to 500 for performance)
  const storySalesRaw = await prisma.saleOrder.findMany({
    take: 500,
    orderBy: { date: 'asc' }, // Ascending to show timeline
    where: { 
      ...dateFilter,
      status: { notIn: ['CANCELED', 'RETURNED', 'DRAFT'] },
    },
    include: {
      lines: { select: { lineTotal: true, cogs: true } },
      orderExpenses: { select: { amount: true } },
    },
  });

  const storySales = storySalesRaw.map(sale => {
    const revenue = sale.lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const cogs = sale.lines.reduce((sum, line) => sum + (line.cogs || 0), 0);
    const expenses = sale.orderExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    const actualCost = sale.customCostOverride ?? cogs;
    const profit = sale.customProfitOverride ?? (revenue - actualCost - expenses);

    return {
      id: sale.id,
      orderNo: sale.orderNo,
      revenue,
      profit,
    };
  });

  return (
    <ProfitsClient
      totalRevenue={totalRevenue}
      totalCogs={adjustedTotalCogs}
      totalExpenses={totalExpenses}
      totalOrderExpenses={totalOrderExpenses}
      netProfit={adjustedNetProfit}
      profitMargin={profitMargin}
      monthlyData={monthlyData}
      expensesByCategory={expensesByCategory}
      orderExpensesByCategory={orderExpensesByCategory}
      salesCount={salesCount}
      recentSales={recentSales}
      storySales={storySales}
      currentPeriod={period}
    />
  );
}
