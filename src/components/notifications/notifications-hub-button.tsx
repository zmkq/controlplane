'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/lib/i18n';

type NotificationRecord = {
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

export function NotificationsHubButton() {
  const router = useRouter();
  const { t } = useTranslations();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load notifications');
      const data = (await response.json()) as NotificationRecord[];
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={t('notifications.title', 'Notifications')}
      onClick={() => router.push('/notifications')}
      className="relative rounded-2xl border border-border/60 bg-background/40 transition hover:bg-background/60"
    >
      <Bell className="h-4 w-4" />
      {!loading && unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Button>
  );
}

