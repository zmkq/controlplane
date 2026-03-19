'use server';

import { prisma } from '@/lib/prisma';

export async function generatePnlReport(month: number, year: number) {
  const sales = await prisma.saleOrder.findMany({
    where: {
      date: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      },
    },
    include: {
      lines: true,
    },
  });

  const expenses = await prisma.expense.findMany({
    where: {
      date: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      },
    },
  });

  let totalRevenue = 0;
  let totalCogs = 0;
  let totalExpenses = 0;
  const expenseByCategory: Record<string, number> = {};
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyRevenue = Array.from({ length: daysInMonth }, (_, index) => ({
    name: `D${index + 1}`,
    revenue: 0,
    expenses: 0,
  }));

  for (const sale of sales) {
    const saleTotal = Number(sale.total ?? 0);
    totalRevenue += saleTotal;
    const saleDay = new Date(sale.date).getDate();
    dailyRevenue[saleDay - 1].revenue += saleTotal;
    for (const line of sale.lines) {
      totalCogs += Number(line.cogs ?? 0);
    }
  }

  for (const expense of expenses) {
    totalExpenses += expense.amount;
    const day = new Date(expense.date).getDate();
    dailyRevenue[day - 1].expenses += expense.amount;
    const bucket = expense.category ?? 'Other';
    expenseByCategory[bucket] = (expenseByCategory[bucket] ?? 0) + expense.amount;
  }

  const netProfit = totalRevenue - totalCogs - totalExpenses;
  const marginPercent = totalRevenue === 0 ? 0 : ((totalRevenue - totalCogs) / totalRevenue) * 100;
  const expenseBreakdown = Object.entries(expenseByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  return {
    totalRevenue,
    totalCogs,
    totalExpenses,
    netProfit,
    orders: sales.length,
    marginPercent,
    dailyRevenue,
    expenseBreakdown,
  };
}
