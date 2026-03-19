import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { broadcastPushNotification } from '@/lib/push';

export async function GET() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 25,
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
  });

  type NotificationWithSaleOrder = typeof notifications[number];

  return NextResponse.json(
    notifications.map((notification: NotificationWithSaleOrder) => ({
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
    }))
  );
}

export async function PATCH(request: Request) {
  const payload = await request.json().catch(() => null);
  const ids = Array.isArray(payload?.ids) ? payload.ids : [];

  if (ids.length) {
    await prisma.notification.updateMany({
      where: { id: { in: ids } },
      data: { read: true },
    });
  } else {
    await prisma.notification.updateMany({
      where: { read: false },
      data: { read: true },
    });
  }

  return NextResponse.json({ success: true });
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
