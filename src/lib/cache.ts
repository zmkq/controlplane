import { unstable_cache } from 'next/cache';
import { prisma } from './prisma';

// ============================================================================
// DASHBOARD KPIS - Cached for 60 seconds
// ============================================================================

async function fetchDashboardKPIs() {
  const [
    totalRevenueResult,
    totalCogsResult,
    totalExpensesResult,
    totalOrderExpensesResult,
    pendingOrdersCount,
    limitedOrders,
    onDemandOrders,
  ] = await Promise.all([
    prisma.saleOrderLine.aggregate({
      where: {
        saleOrder: {
          status: { notIn: ['CANCELED', 'RETURNED', 'DRAFT'] },
        },
      },
      _sum: { lineTotal: true },
    }),
    prisma.saleOrderLine.aggregate({
      where: {
        saleOrder: {
          status: { notIn: ['CANCELED', 'RETURNED', 'DRAFT'] },
        },
      },
      _sum: { cogs: true },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
    }),
    prisma.orderExpense.aggregate({
      where: {
        saleOrder: {
          status: { notIn: ['CANCELED', 'RETURNED', 'DRAFT'] },
        },
      },
      _sum: { amount: true },
    }),
    prisma.saleOrder.count({
      where: { status: { not: 'DELIVERED' } },
    }),
    prisma.saleOrder.count({
      where: { fulfillmentMode: 'LIMITED' },
    }),
    prisma.saleOrder.count({
      where: { fulfillmentMode: 'ON_DEMAND' },
    }),
  ]);

  const totalRevenue = Number(totalRevenueResult._sum.lineTotal ?? 0);
  const totalCogs = Number(totalCogsResult._sum.cogs ?? 0);
  const totalExpenses = Number(totalExpensesResult._sum.amount ?? 0);
  const totalOrderExpenses = Number(totalOrderExpensesResult._sum.amount ?? 0);

  // Fetch Overrides for Adjustment (from ProfitsPage logic)
  const overriddenOrders = await prisma.saleOrder.findMany({
    where: {
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
  const netProfit = totalRevenue - adjustedTotalCogs - totalExpenses - totalOrderExpenses;
  const totalOrderMix = limitedOrders + onDemandOrders || 1;

  return {
    totalRevenue,
    totalCogs,
    totalExpenses,
    totalOrderExpenses,
    netProfit,
    pendingOrdersCount,
    orderMix: {
      limited: (limitedOrders / totalOrderMix) * 100,
      onDemand: (onDemandOrders / totalOrderMix) * 100,
    },
  };
}

export const getCachedDashboardKPIs = unstable_cache(
  fetchDashboardKPIs,
  ['dashboard-kpis'],
  { revalidate: 60, tags: ['dashboard', 'sales', 'expenses'] }
);

// ============================================================================
// MONTHLY CHART DATA - Cached for 5 minutes
// ============================================================================

async function fetchMonthlyChartData() {
  const today = new Date();
  const monthPromises = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);

    monthPromises.push(
      Promise.all([
        prisma.saleOrderLine.aggregate({
          _sum: { lineTotal: true },
          where: {
            saleOrder: {
              date: { gte: monthStart, lt: monthEnd },
              status: { notIn: ['CANCELED', 'RETURNED', 'DRAFT'] },
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
              status: { notIn: ['CANCELED', 'RETURNED', 'DRAFT'] },
            },
          },
        }),
        Promise.resolve(date),
      ])
    );
  }

  const monthlyResults = await Promise.all(monthPromises);
  return monthlyResults.map(([sales, expenses, orderExpenses, date]) => ({
    name: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
    revenue: Number(sales._sum.lineTotal ?? 0),
    expenses: Number(expenses._sum.amount ?? 0) + Number(orderExpenses._sum.amount ?? 0),
  }));
}

export const getCachedMonthlyData = unstable_cache(
  fetchMonthlyChartData,
  ['monthly-chart-data'],
  { revalidate: 300, tags: ['dashboard', 'sales', 'expenses'] }
);

// ============================================================================
// GROWTH METRICS - Cached for 60 seconds
// ============================================================================

async function fetchGrowthMetrics() {
  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = currentMonthStart;

  const [lastMonthRevenueResult, lastMonthCogsResult, lastMonthExpensesResult, lastMonthOrderExpensesResult] = 
    await Promise.all([
      prisma.saleOrderLine.aggregate({
        _sum: { lineTotal: true },
        where: {
          saleOrder: {
            date: { gte: lastMonthStart, lt: lastMonthEnd },
            status: { notIn: ['CANCELED', 'RETURNED', 'DRAFT'] },
          },
        },
      }),
      prisma.saleOrderLine.aggregate({
        _sum: { cogs: true },
        where: {
          saleOrder: {
            date: { gte: lastMonthStart, lt: lastMonthEnd },
            status: { notIn: ['CANCELED', 'RETURNED', 'DRAFT'] },
          },
        },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: {
          date: { gte: lastMonthStart, lt: lastMonthEnd },
        },
      }),
      prisma.orderExpense.aggregate({
        _sum: { amount: true },
        where: {
          saleOrder: {
            date: { gte: lastMonthStart, lt: lastMonthEnd },
            status: { notIn: ['CANCELED', 'RETURNED', 'DRAFT'] },
          },
        },
      }),
    ]);

  const lastMonthRevenue = Number(lastMonthRevenueResult._sum.lineTotal ?? 0);
  const lastMonthCogs = Number(lastMonthCogsResult._sum.cogs ?? 0);
  const lastMonthExpenses = Number(lastMonthExpensesResult._sum.amount ?? 0);
  const lastMonthOrderExpenses = Number(lastMonthOrderExpensesResult._sum.amount ?? 0);

  return {
    lastMonthRevenue,
    lastMonthProfit: lastMonthRevenue - lastMonthCogs - lastMonthExpenses - lastMonthOrderExpenses,
  };
}

export const getCachedGrowthMetrics = unstable_cache(
  fetchGrowthMetrics,
  ['growth-metrics'],
  { revalidate: 60, tags: ['dashboard', 'sales', 'expenses'] }
);

// ============================================================================
// PRODUCT PERFORMANCE - Cached for 2 minutes
// ============================================================================

async function fetchProductPerformance() {
  const productSales = await prisma.saleOrderLine.groupBy({
    by: ['productId'],
    where: {
      saleOrder: {
        status: { notIn: ['CANCELED', 'RETURNED', 'DRAFT'] },
      },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5,
  });

  const productIds = productSales.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p.name]));
  return productSales.map((item) => ({
    name: productMap.get(item.productId) || 'Unknown Product',
    value: item._sum.quantity || 0,
  }));
}

export const getCachedProductPerformance = unstable_cache(
  fetchProductPerformance,
  ['product-performance'],
  { revalidate: 120, tags: ['dashboard', 'sales', 'products'] }
);

// ============================================================================
// RECENT ORDERS - Cached for 30 seconds (shorter for fresh data)
// ============================================================================

async function fetchRecentOrders() {
  return prisma.saleOrder.findMany({
    orderBy: { date: 'desc' },
    take: 6,
    include: {
      customer: { select: { name: true } },
      lines: {
        include: {
          product: { select: { name: true } },
        },
      },
    },
  });
}

export const getCachedRecentOrders = unstable_cache(
  fetchRecentOrders,
  ['recent-orders'],
  { revalidate: 30, tags: ['dashboard', 'sales'] }
);

// ============================================================================
// LOW STOCK PRODUCTS - Cached for 2 minutes
// ============================================================================

async function fetchLowStockProducts() {
  return prisma.product.findMany({
    where: {
      quantity: { lte: 5 },
      active: true,
    },
    select: {
      id: true,
      sku: true,
      name: true,
      quantity: true,
    },
  });
}

export const getCachedLowStockProducts = unstable_cache(
  fetchLowStockProducts,
  ['low-stock-products'],
  { revalidate: 120, tags: ['dashboard', 'products'] }
);

// ============================================================================
// SUPPLIERS/PARTNERS - Cached for 5 minutes
// ============================================================================

async function fetchSuppliers() {
  return prisma.supplier.findMany({
    include: {
      partnerOrders: {
        include: {
          courierBooking: { select: { deliveredAt: true } },
        },
      },
    },
  });
}

export const getCachedSuppliers = unstable_cache(
  fetchSuppliers,
  ['suppliers'],
  { revalidate: 300, tags: ['dashboard', 'agents'] }
);

// ============================================================================
// INVENTORY LEVELS - Cached for 2 minutes
// ============================================================================

async function fetchInventoryLevels() {
  return prisma.product.findMany({
    take: 5,
    orderBy: { quantity: 'asc' },
    select: { name: true, quantity: true },
  });
}

export const getCachedInventoryLevels = unstable_cache(
  fetchInventoryLevels,
  ['inventory-levels'],
  { revalidate: 120, tags: ['dashboard', 'products'] }
);

// ============================================================================
// DELIVERED ORDERS FOR AVG - Cached for 5 minutes
// ============================================================================

async function fetchDeliveredOrders() {
  return prisma.saleOrder.findMany({
    where: { status: 'DELIVERED' },
    select: { date: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 24,
  });
}

export const getCachedDeliveredOrders = unstable_cache(
  fetchDeliveredOrders,
  ['delivered-orders'],
  { revalidate: 300, tags: ['dashboard', 'sales'] }
);

// ============================================================================
// SALES PAGE METRICS - Cached for 30 seconds
// ============================================================================

async function fetchSalesPageMetrics() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const [revenueAgg, pendingCount, latestSale, totalCount] = await Promise.all([
    prisma.saleOrder.aggregate({
      _sum: { total: true },
      where: {
        date: { gte: weekAgo },
      },
    }),
    prisma.saleOrder.count({
      where: { status: { not: 'DELIVERED' } },
    }),
    prisma.saleOrder.findFirst({
      orderBy: { date: 'desc' },
      select: { channel: true },
    }),
    prisma.saleOrder.count(),
  ]);

  return {
    revenueThisWeek: Number(revenueAgg._sum.total ?? 0),
    pendingCount,
    latestChannel: latestSale?.channel ?? '—',
    totalCount,
  };
}

export const getCachedSalesPageMetrics = unstable_cache(
  fetchSalesPageMetrics,
  ['sales-page-metrics'],
  { revalidate: 30, tags: ['sales'] }
);

// ============================================================================
// SALES LIST (with pagination/filters) - Not cached (dynamic)
// But we can cache the count for faster pagination
// ============================================================================

export async function fetchSalesWithFilters(
  where: Record<string, unknown>,
  currentPage: number,
  pageSize: number
) {
  const [sales, totalCount] = await Promise.all([
    prisma.saleOrder.findMany({
      where: where as any,
      include: {
        customer: true,
        partner: { select: { id: true, name: true } },
        lines: { include: { product: true } },
      },
      orderBy: { date: 'desc' },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.saleOrder.count({ where: where as any }),
  ]);

  return { sales, totalCount };
}

// ============================================================================
// PRODUCTS PAGE - Cached for 60 seconds
// ============================================================================

async function fetchProductsPageData() {
  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        inventoryLots: true,
        supplierProducts: {
          include: { supplier: true },
        },
      },
    }),
    prisma.product.count(),
  ]);

  return { products, totalCount };
}

export const getCachedProductsPageData = unstable_cache(
  fetchProductsPageData,
  ['products-page-data'],
  { revalidate: 60, tags: ['products'] }
);

