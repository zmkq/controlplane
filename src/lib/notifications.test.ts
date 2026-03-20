import { describe, expect, it } from 'vitest';
import {
  clampNotificationLimit,
  countUnreadTransitions,
  markNotificationsRead,
  type NotificationRecord,
} from '@/lib/notifications';

const notifications: NotificationRecord[] = [
  {
    id: 'a',
    title: 'A',
    body: 'Alpha',
    createdAt: '2026-03-20T00:00:00.000Z',
    read: false,
    saleOrder: null,
  },
  {
    id: 'b',
    title: 'B',
    body: 'Beta',
    createdAt: '2026-03-20T00:00:00.000Z',
    read: true,
    saleOrder: null,
  },
];

describe('clampNotificationLimit', () => {
  it('keeps the limit within the supported range', () => {
    expect(clampNotificationLimit('0')).toBe(1);
    expect(clampNotificationLimit('999')).toBe(100);
    expect(clampNotificationLimit('40')).toBe(40);
    expect(clampNotificationLimit(null)).toBe(25);
  });

  it('falls back when the query param is blank or whitespace-only', () => {
    expect(clampNotificationLimit('')).toBe(25);
    expect(clampNotificationLimit('   ')).toBe(25);
    expect(clampNotificationLimit('   ', 10)).toBe(10);
  });
});

describe('markNotificationsRead', () => {
  it('marks only the targeted notifications as read', () => {
    expect(markNotificationsRead(notifications, ['a'])).toEqual([
      {
        ...notifications[0],
        read: true,
      },
      notifications[1],
    ]);
  });
});

describe('countUnreadTransitions', () => {
  it('counts only unread notifications that will change state', () => {
    expect(countUnreadTransitions(notifications, ['a', 'b'])).toBe(1);
    expect(countUnreadTransitions(notifications)).toBe(1);
  });
});
