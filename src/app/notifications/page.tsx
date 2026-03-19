import { prisma } from '@/lib/prisma';
import { NotificationsPageClient } from '@/components/notifications/notifications-page-client';

export default async function NotificationsPage() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
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

  const stats = await Promise.all([
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

  const [total, unread, today, linkedOrders] = stats;

  return (
    <NotificationsPageClient
      initialNotifications={notifications.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        createdAt: n.createdAt.toISOString(),
        read: n.read,
        saleOrder: n.saleOrder
          ? {
              id: n.saleOrder.id,
              orderNo: n.saleOrder.orderNo,
              customerName: n.saleOrder.customer?.name ?? 'Customer',
            }
          : null,
      }))}
      initialStats={{
        total,
        unread,
        today,
        linkedOrders,
      }}
    />
  );
}
