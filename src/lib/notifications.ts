export type NotificationRecord = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  saleOrder?: {
    id: string;
    orderNo: string;
    customerName: string;
  } | null;
};

export type NotificationStats = {
  total: number;
  unread: number;
  today: number;
  linkedOrders: number;
};

export type NotificationFeedResponse = {
  notifications: NotificationRecord[];
  stats: NotificationStats;
  fetchedAt: string;
};

export function clampNotificationLimit(value: string | null, fallback = 25) {
  if (value === null) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(parsed), 1), 100);
}

export function markNotificationsRead(
  notifications: NotificationRecord[],
  ids?: string[],
) {
  if (!ids?.length) {
    return notifications.map((notification) => ({
      ...notification,
      read: true,
    }));
  }

  const idSet = new Set(ids);

  return notifications.map((notification) =>
    idSet.has(notification.id)
      ? { ...notification, read: true }
      : notification,
  );
}

export function countUnreadTransitions(
  notifications: NotificationRecord[],
  ids?: string[],
) {
  if (!ids?.length) {
    return notifications.filter((notification) => !notification.read).length;
  }

  const idSet = new Set(ids);
  return notifications.filter(
    (notification) => idSet.has(notification.id) && !notification.read,
  ).length;
}
