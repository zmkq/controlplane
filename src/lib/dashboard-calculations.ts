import { prisma } from '@/lib/prisma';

type SaleOrderWithCourier = {
  date: Date | string;
  updatedAt: Date | string;
  status: string;
  courierBooking?: {
    deliveredAt: Date | string | null;
  } | null;
};

/**
 * Calculate average margin for a product from sales data
 * Margin = (avg(unitPrice) - cost) / cost * 100
 */
export async function calculateProductMargin(
  productId: string
): Promise<number> {
  const sales = await prisma.saleOrderLine.findMany({
    where: { productId },
    select: {
      unitPrice: true,
      cogs: true,
    },
  });

  if (sales.length === 0) {
    return 0;
  }

  const avgUnitPrice =
    sales.reduce((sum, sale) => sum + Number(sale.unitPrice ?? 0), 0) /
    sales.length;
  const avgCogs =
    sales.reduce((sum, sale) => sum + Number(sale.cogs ?? 0), 0) / sales.length;

  if (avgCogs === 0) {
    return 0;
  }

  return ((avgUnitPrice - avgCogs) / avgCogs) * 100;
}

/**
 * Calculate month-over-month trend for a product
 * Trend = ((current month sales - previous month sales) / previous month sales) * 100
 */
export async function calculateProductTrend(
  productId: string
): Promise<number> {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [currentMonthSales, previousMonthSales] = await Promise.all([
    prisma.saleOrderLine.aggregate({
      _sum: { quantity: true },
      where: {
        productId,
        saleOrder: {
          date: {
            gte: currentMonthStart,
          },
        },
      },
    }),
    prisma.saleOrderLine.aggregate({
      _sum: { quantity: true },
      where: {
        productId,
        saleOrder: {
          date: {
            gte: previousMonthStart,
            lt: currentMonthStart,
          },
        },
      },
    }),
  ]);

  const currentQty = currentMonthSales._sum.quantity ?? 0;
  const previousQty = previousMonthSales._sum.quantity ?? 0;

  if (previousQty === 0) {
    return currentQty > 0 ? 100 : 0;
  }

  return ((currentQty - previousQty) / previousQty) * 100;
}

/**
 * Calculate partner reliability score based on on-time delivery and completion rate
 * Reliability = (deliveredOnTime / totalOrders) * 100
 * For now, we'll use a simplified version: (delivered orders / total orders) * 100
 */
export function calculatePartnerReliability(
  orders: SaleOrderWithCourier[]
): number {
  if (orders.length === 0) {
    return 0;
  }

  const deliveredOrders = orders.filter(
    (order) => order.status === 'DELIVERED'
  ).length;
  return (deliveredOrders / orders.length) * 100;
}

/**
 * Calculate average turnaround time for a partner
 * Turnaround = average time from order creation to delivery
 */
export function calculatePartnerTurnaround(
  orders: SaleOrderWithCourier[]
): string {
  const deliveredOrders = orders.filter(
    (order) => order.status === 'DELIVERED'
  );

  if (deliveredOrders.length === 0) {
    return 'N/A';
  }

  const totalMs = deliveredOrders.reduce((sum, order) => {
    // Handle both Date objects and ISO strings from cache serialization
    const deliveredAt = order.courierBooking?.deliveredAt;
    const updatedAt = order.updatedAt;
    
    const deliveryDateObj = deliveredAt 
      ? new Date(deliveredAt) 
      : new Date(updatedAt);
      
    const orderDateObj = new Date(order.date);

    const ms = Math.max(deliveryDateObj.getTime() - orderDateObj.getTime(), 0);
    return sum + ms;
  }, 0);

  const avgMs = totalMs / deliveredOrders.length;
  return formatTurnaroundTime(avgMs);
}

/**
 * Format turnaround time in milliseconds to human-readable string
 */
export function formatTurnaroundTime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.round((ms - hours * 60 * 60 * 1000) / (1000 * 60));

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return '--';
  }

  if (hours === 0) {
    return `<${Math.max(minutes, 1)}h`;
  }

  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (remainingHours === 0) {
    return `${days}d`;
  }

  return `${days}d ${remainingHours}h`;
}

/**
 * Calculate average fulfillment time from delivered orders
 * Reuses logic from /api/metrics/route.ts
 */
export function formatAverageTurnaround(
  orders: {
    date: Date | string;
    updatedAt: Date | string;
  }[]
): string {
  if (!orders.length) {
    return '--';
  }

  const totalMs = orders.reduce((sum, order) => {
    const updatedAtObj = new Date(order.updatedAt);
    const dateObj = new Date(order.date);
    
    const ms = Math.max(updatedAtObj.getTime() - dateObj.getTime(), 0);
    return sum + ms;
  }, 0);

  const avgMs = totalMs / orders.length;
  const hours = Math.floor(avgMs / (1000 * 60 * 60));
  const minutes = Math.round((avgMs - hours * 60 * 60 * 1000) / (1000 * 60));

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return '--';
  }

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}
