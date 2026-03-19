import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { broadcastPushNotification } from '@/lib/push';
import { clampNotificationLimit } from '@/lib/notifications';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = clampNotificationLimit(url.searchParams.get('limit'));

  const [notifications, total, unread, today, linkedOrders] = await Promise.all([
    prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        saleOrder: {
          select: {
            id: true,
            orderNo: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.notification.count(),
    prisma.notification.count({
      where: { read: false },
    }),
    prisma.notification.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.notification.count({
      where: {
        saleOrderId: { not: null },
      },
    }),
  ]);

  type NotificationWithSaleOrder = typeof notifications[number];

  return NextResponse.json({
    notifications: notifications.map(
      (notification: NotificationWithSaleOrder) => ({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        saleOrderId: notification.saleOrderId,
        saleOrder: notification.saleOrder
          ? {
              id: notification.saleOrder.id,
              orderNo: notification.saleOrder.orderNo,
              customerName: notification.saleOrder.customer?.name ?? 'Customer',
            }
          : null,
        read: notification.read,
        createdAt: notification.createdAt,
      }),
    ),
    stats: {
      total,
      unread,
      today,
      linkedOrders,
    },
    fetchedAt: new Date().toISOString(),
  });
}

export async function PATCH(request: Request) {
  const payload = await request.json().catch(() => null);
  const ids = Array.isArray(payload?.ids) ? payload.ids : [];

  const result = ids.length
    ? await prisma.notification.updateMany({
        where: { id: { in: ids } },
        data: { read: true },
      })
    : await prisma.notification.updateMany({
        where: { read: false },
        data: { read: true },
      });

  return NextResponse.json({ success: true, updatedCount: result.count });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const title =
    typeof payload?.title === 'string' && payload.title.trim().length
      ? payload.title.trim()
      : 'Test notification';
  const body =
    typeof payload?.body === 'string' && payload.body.trim().length
      ? payload.body.trim()
      : 'Triggered from the Products page tester.';

  const notification = await prisma.notification.create({
    data: {
      title,
      body,
      read: false,
    },
  });

  await broadcastPushNotification({
    title,
    body,
    notificationId: notification.id,
    saleOrderId: notification.saleOrderId,
  });

  return NextResponse.json({ success: true, notification });
}
