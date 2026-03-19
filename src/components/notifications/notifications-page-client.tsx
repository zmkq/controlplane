'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  Sparkles,
  Clock,
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  X,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

type Stats = {
  total: number;
  unread: number;
  today: number;
  linkedOrders: number;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

export function NotificationsPageClient({
  initialNotifications,
  initialStats,
}: {
  initialNotifications: NotificationRecord[];
  initialStats: Stats;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const { t, lang } = useTranslations();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load notifications');
      const data = (await response.json()) as NotificationRecord[];
      setNotifications(data);

      // Update stats
      const now = new Date();
      const today = data.filter((n) => {
        const created = new Date(n.createdAt);
        return (
          created.getFullYear() === now.getFullYear() &&
          created.getMonth() === now.getMonth() &&
          created.getDate() === now.getDate()
        );
      }).length;

      setStats({
        total: data.length,
        unread: data.filter((n) => !n.read).length,
        today,
        linkedOrders: data.filter((n) => Boolean(n.saleOrder)).length,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Apply filter
    if (filter === 'unread') {
      filtered = filtered.filter((n) => !n.read);
    } else if (filter === 'read') {
      filtered = filtered.filter((n) => n.read);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.body.toLowerCase().includes(query) ||
          n.saleOrder?.orderNo.toLowerCase().includes(query) ||
          n.saleOrder?.customerName.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [notifications, filter, searchQuery]);

  const markAllRead = useCallback(async () => {
    if (!notifications.length) return;
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: notifications.filter((n) => !n.read).map((n) => n.id),
        }),
      });
      await fetchNotifications();
    } catch (error) {
      console.error(error);
    }
  }, [notifications, fetchNotifications]);

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [id] }),
        });
        await fetchNotifications();
      } catch (error) {
        console.error(error);
      }
    },
    [fetchNotifications]
  );

  return (
    <div className="min-h-screen space-y-6 px-4 pb-24 pt-6 sm:px-6 lg:px-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel rounded-3xl border border-border/60 bg-background/40 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                {stats.unread > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-lg">
                    {stats.unread > 9 ? '9+' : stats.unread}
                  </motion.span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                  {t('notifications.title', 'Notifications')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t(
                    'notifications.heroSubtitle',
                    'Limited stock triggers, partner pings, and courier handoffs in one feed.'
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchNotifications}
              disabled={loading}
              className="rounded-xl border-border/60 bg-background/40">
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
            {stats.unread > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllRead}
                className="rounded-xl border-border/60 bg-background/40">
                {t('notifications.markRead', 'Mark all read')}
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Widgets */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatWidget
          label={t('notifications.stats.total', 'Total')}
          value={stats.total}
          icon={Bell}
          color="text-primary"
          bgColor="bg-primary/10"
          borderColor="border-primary/30"
          delay={0}
        />
        <StatWidget
          label={t('notifications.stats.unread', 'Unread')}
          value={stats.unread}
          icon={AlertCircle}
          color="text-destructive"
          bgColor="bg-destructive/10"
          borderColor="border-destructive/30"
          delay={0.1}
        />
        <StatWidget
          label={t('notifications.stats.today', 'Today')}
          value={stats.today}
          icon={Clock}
          color="text-accent"
          bgColor="bg-accent/10"
          borderColor="border-accent/30"
          delay={0.2}
        />
        <StatWidget
          label={t('notifications.stats.linked', 'Linked Orders')}
          value={stats.linkedOrders}
          icon={Sparkles}
          color="text-emerald-300"
          bgColor="bg-emerald-500/10"
          borderColor="border-emerald-500/30"
          delay={0.3}
        />
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-panel rounded-3xl border border-border/60 bg-background/40 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('notifications.search', 'Search notifications...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border/60 bg-background/60 px-10 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex rounded-xl border border-border/60 bg-background/60 p-1">
              {(['all', 'unread', 'read'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition',
                    filter === f
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}>
                  {t(`notifications.filter.${f}`, f)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notifications List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-3xl border border-dashed border-border/60 bg-background/30 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border/60 bg-background/60">
              <Bell className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-lg font-semibold text-foreground">
              {searchQuery || filter !== 'all'
                ? t('notifications.noResults', 'No notifications found')
                : t(
                    'notifications.empty',
                    'No alerts yet. Orders will pop up the moment they move.'
                  )}
            </p>
            {(searchQuery || filter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilter('all');
                }}
                className="mt-4 text-sm text-primary hover:underline">
                {t('notifications.clearFilters', 'Clear filters')}
              </button>
            )}
          </motion.div>
        ) : (
          filteredNotifications.map((notification, index) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              lang={lang}
              onMarkAsRead={() => markAsRead(notification.id)}
              delay={index * 0.05}
            />
          ))
        )}
      </motion.div>
    </div>
  );
}

function StatWidget({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
  borderColor,
  delay,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  delay: number;
}) {
  return (
    <motion.div
      variants={itemVariants}
      transition={{ delay }}
      className={cn(
        'glass-panel rounded-2xl border p-5 transition-all hover:scale-[1.02]',
        borderColor
      )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {label}
          </p>
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.2, type: 'spring' }}
            className={cn('mt-2 text-3xl font-bold', color)}>
            {value}
          </motion.p>
        </div>
        <div className={cn('rounded-xl p-2.5', bgColor)}>
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </motion.div>
  );
}

function NotificationCard({
  notification,
  lang,
  onMarkAsRead,
  delay,
}: {
  notification: NotificationRecord;
  lang: string;
  onMarkAsRead: () => void;
  delay: number;
}) {
  const { t } = useTranslations();
  const hasLinkedOrder = Boolean(notification.saleOrder);
  const fallbackName =
    notification.saleOrder?.customerName ??
    t('notifications.fallbackCustomer', 'Customer');

  return (
    <motion.div
      variants={itemVariants}
      transition={{ delay }}
      className={cn(
        'group glass-panel rounded-2xl border p-5 transition-all hover:scale-[1.01] hover:shadow-xl',
        !notification.read
          ? 'border-primary/50 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-[0_4px_12px_rgba(219,236,10,0.15)]'
          : 'border-border/60 bg-background/40'
      )}>
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all',
            !notification.read
              ? 'bg-primary/20 shadow-[0_4px_12px_rgba(219,236,10,0.2)]'
              : 'bg-background/60'
          )}>
          {!notification.read ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-muted-foreground/60" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">
                  {notification.title}
                </h3>
                {!notification.read && (
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">
                    {t('notifications.liveBadge', 'Live')}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {notification.body}
              </p>
            </div>
            {!notification.read && (
              <button
                onClick={onMarkAsRead}
                className="shrink-0 rounded-lg border border-border/60 bg-background/60 p-2 text-muted-foreground transition hover:bg-background/80 hover:text-foreground"
                aria-label={t('notifications.markRead', 'Mark as read')}>
                <CheckCircle2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {hasLinkedOrder && (
            <Link
              href={`/sales/${notification.saleOrder?.id}`}
              className="group/link flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 transition-all hover:bg-emerald-500/20">
              <Sparkles className="h-4 w-4 text-emerald-300" />
              <span className="text-xs font-medium text-emerald-300">
                {notification.saleOrder?.orderNo} — {fallbackName}
              </span>
              <ArrowRight className="ml-auto h-3 w-3 text-emerald-300 opacity-0 transition group-hover/link:opacity-100" />
            </Link>
          )}

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground/70">
              {formatRelativeTime(notification.createdAt, lang)}
            </p>
            {notification.read && (
              <span className="text-xs text-muted-foreground/50">
                {t('notifications.read', 'Read')}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function formatRelativeTime(dateString: string, lang: string) {
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return lang === 'ar' ? 'الآن' : 'Just now';
  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return lang === 'ar' ? `قبل ${minutes} دقيقة` : `${minutes}m ago`;
  }
  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return lang === 'ar' ? `قبل ${hours} ساعة` : `${hours}h ago`;
  }
  const days = Math.floor(diff / day);
  return lang === 'ar' ? `قبل ${days} يوم` : `${days}d ago`;
}
