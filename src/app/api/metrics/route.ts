import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CLOSED_STATUSES = ['DELIVERED', 'CANCELED', 'RETURNED'] as const;
const CLOSED_STATUSES_MUTABLE = [...CLOSED_STATUSES];

export async function GET() {
  const [liveOrders, onDemandQueue, products, deliveredOrders] = await Promise.all([
    prisma.saleOrder.count({
      where: {
        status: {
          notIn: CLOSED_STATUSES_MUTABLE,
        },
      },
    }),
    prisma.saleOrder.count({
      where: {
        fulfillmentMode: 'ON_DEMAND',
        status: {
          notIn: CLOSED_STATUSES_MUTABLE,
        },
      },
    }),
    prisma.product.findMany({
      select: {
        quantity: true,
        attributes: true,
      },
    }),
    prisma.saleOrder.findMany({
      where: {
        status: 'DELIVERED',
      },
      select: {
        date: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 24,
    }),
  ]);

  const limitedUnits = products.reduce((sum: number, product: { quantity: number | null; attributes: unknown }) => {
    const attributes =
      product.attributes && typeof product.attributes === 'object' && !Array.isArray(product.attributes)
        ? (product.attributes as { fulfillmentMode?: string })
        : {};
    const isOnDemand = attributes.fulfillmentMode === 'on-demand';
    if (isOnDemand) {
      return sum;
    }
    return sum + Math.max(Number(product.quantity ?? 0), 0);
  }, 0);

  const avgTurnaroundLabel = formatAverageTurnaround(deliveredOrders);

  return NextResponse.json({
    liveOrders,
    limitedUnits,
    onDemandQueue,
    avgTurnaroundLabel,
  });
}

function formatAverageTurnaround(
  orders: {
    date: Date;
    updatedAt: Date;
  }[]
) {
  if (!orders.length) {
    return '--';
  }

  const totalMs = orders.reduce((sum, order) => {
    const ms = Math.max(order.updatedAt.getTime() - order.date.getTime(), 0);
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
