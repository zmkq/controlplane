'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCircle2, Loader2, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

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

const panelVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
};

export function NotificationsHub() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { t, lang } = useTranslations();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load notifications');
      const data = (await response.json()) as NotificationRecord[];
      setNotifications(
        data.map((item) => ({
          ...item,
          createdAt: item.createdAt,
        })),
      );
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const query = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const todaysAlerts = useMemo(() => {
    const now = new Date();
    return notifications.filter((notification) => {
      const created = new Date(notification.createdAt);
      return (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth() &&
        created.getDate() === now.getDate()
      );
    }).length;
  }, [notifications]);

  const linkedOrders = useMemo(
    () =>
      notifications.filter((notification) => Boolean(notification.saleOrder))
        .length,
    [notifications],
  );

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

  const renderMobileContent = () => {
    const lastSyncSource =
      notifications[0]?.createdAt ?? new Date().toISOString();

    return (
      <div className="flex h-full min-h-0 flex-col">
        {/* Mobile Header */}
        <div className="shrink-0 border-b border-border/40 bg-background/98 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="h-5 w-5 text-primary" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {t('notifications.title', 'Notifications')}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  {todaysAlerts} {t('notifications.stats.today', 'Today')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="touch-manipulation rounded-full p-2 text-muted-foreground transition active:bg-background/60"
              aria-label={t('notifications.close', 'Close')}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile Stats Bar */}
        {notifications.length > 0 && (
          <div className="shrink-0 border-b border-border/40 bg-background/40 px-4 py-3">
            <div className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/20 px-2 py-1 font-semibold text-primary">
                  {unreadCount} {t('notifications.stats.unread', 'Unread')}
                </span>
                {linkedOrders > 0 && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-1 font-semibold text-emerald-300">
                    {linkedOrders} {t('notifications.stats.linked', 'Orders')}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="touch-manipulation text-[10px] font-semibold uppercase tracking-wider text-primary transition active:text-primary/80">
                  {t('notifications.markRead', 'Mark all read')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mobile Notifications List */}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 scrollbar-hide">
          {loading ? (
            <div className="flex h-full items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length ? (
            <div className="space-y-3 pb-2">
              {notifications.map((item) => (
                <NotificationItem
                  key={item.id}
                  notification={item}
                  lang={lang}
                  isMobile={true}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              message={t(
                'notifications.empty',
                'No alerts yet. Orders will pop up the moment they move.',
              )}
            />
          )}
        </div>

        {/* Mobile Footer */}
        {notifications.length > 0 && (
          <div className="shrink-0 border-t border-border/40 bg-background/40 px-4 py-3">
            <p className="text-[10px] text-muted-foreground">
              {t('notifications.lastSync', 'Last sync')}{' '}
              {formatRelativeTime(lastSyncSource, lang)}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderDesktopContent = () => {
    const lastSyncSource =
      notifications[0]?.createdAt ?? new Date().toISOString();

    return (
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {t('notifications.heroTitle', 'Live alerts')}
            </p>
            <p className="text-lg font-semibold text-foreground">
              {t('notifications.title', 'Notifications')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(
                'notifications.heroSubtitle',
                'Limited stock triggers, partner pings, and courier handoffs in one feed.',
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full border border-border/60 p-2 text-muted-foreground transition hover:text-foreground"
            aria-label={t('notifications.close', 'Close')}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3 rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background px-4 py-3 text-sm sm:grid-cols-3">
          <StatPill
            label={t('notifications.stats.unread', 'Unread')}
            value={unreadCount}
            accent="text-primary"
          />
          <StatPill
            label={t('notifications.stats.today', 'Today')}
            value={todaysAlerts}
            accent="text-accent"
          />
          <StatPill
            label={t('notifications.stats.linked', 'Linked orders')}
            value={linkedOrders}
            accent="text-emerald-300"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {notifications.length
              ? `${t(
                  'notifications.lastSync',
                  'Last sync',
                )} ${formatRelativeTime(lastSyncSource, lang)}`
              : t(
                  'notifications.empty',
                  'No alerts yet. Orders will pop up the moment they move.',
                )}
          </span>
          <button
            type="button"
            onClick={markAllRead}
            disabled={!notifications.length}
            className="rounded-full border border-border/50 px-3 py-1 font-semibold text-[10px] uppercase tracking-[0.25em] text-foreground transition disabled:opacity-40">
            {t('notifications.markRead', 'Mark read')}
          </button>
        </div>

        <div className="grow overflow-y-auto pr-1">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length ? (
            <div className="space-y-3">
              {notifications.map((item) => (
                <NotificationItem
                  key={item.id}
                  notification={item}
                  lang={lang}
                  isMobile={false}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              message={t(
                'notifications.empty',
                'No alerts yet. Orders will pop up the moment they move.',
              )}
            />
          )}
        </div>

        <div className="rounded-3xl border border-dashed border-border/60 bg-background/40 px-4 py-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">
            {t('notifications.proTipTitle', 'Pro tip')}
          </p>
          <p>
            {t(
              'notifications.proTip',
              'Pin Controlplane to your home screen and keep alerts on for instant courier updates.',
            )}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t('notifications.title', 'Notifications')}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-2xl border border-border/60 bg-background/40">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isMobile ? (
        <MobileDrawer open={open} onClose={() => setOpen(false)}>
          {renderMobileContent()}
        </MobileDrawer>
      ) : (
        <DesktopPopover open={open}>{renderDesktopContent()}</DesktopPopover>
      )}
    </div>
  );
}

function MobileDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <motion.div
            className="fixed left-0 right-0 z-[101] flex flex-col rounded-t-[2rem] border-t border-border/60 bg-background/98 shadow-[0_-20px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
            style={{
              bottom: 0,
              height: 'calc(100vh - env(safe-area-inset-bottom))',
              maxHeight: '90vh',
              paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}>
            {/* Drag Handle */}
            <div className="flex shrink-0 justify-center pt-3 pb-2">
              <div className="h-1 w-12 rounded-full bg-border/60" />
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DesktopPopover({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute right-0 top-12 z-50 w-96 rounded-3xl border border-border/60 bg-background/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit">
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NotificationItem({
  notification,
  lang,
  isMobile,
}: {
  notification: NotificationRecord;
  lang: string;
  isMobile: boolean;
}) {
  const { t } = useTranslations();
  const hasLinkedOrder = Boolean(notification.saleOrder);
  const fallbackName =
    notification.saleOrder?.customerName ??
    t('notifications.fallbackCustomer', 'Customer');

  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          'rounded-2xl border px-4 py-3.5 transition-all',
          !notification.read
            ? 'border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-[0_4px_12px_rgba(219,236,10,0.15)]'
            : 'border-border/40 bg-background/40',
        )}>
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
              !notification.read ? 'bg-primary/20' : 'bg-background/60',
            )}>
            {!notification.read ? (
              <Bell className="h-4 w-4 text-primary" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-muted-foreground/60" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-foreground leading-tight">
                {notification.title}
              </p>
              {!notification.read && (
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              )}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {notification.body}
            </p>
            {hasLinkedOrder && (
              <div className="flex items-center gap-2 pt-1">
                <Sparkles className="h-3 w-3 text-emerald-300" />
                <p className="text-xs font-medium text-emerald-300">
                  {notification.saleOrder?.orderNo} — {fallbackName}
                </p>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground/70">
              {formatRelativeTime(notification.createdAt, lang)}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-border/60 bg-background/30 px-4 py-3 text-sm transition',
        !notification.read && 'border-primary/50 bg-primary/5',
      )}>
      <div className="flex items-start gap-3">
        <IconForNotification read={notification.read} />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground">
              {notification.title}
            </p>
            {!notification.read && (
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">
                {t('notifications.liveBadge', 'Live')}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{notification.body}</p>
          {hasLinkedOrder && (
            <p className="text-[11px] text-muted-foreground/70">
              {notification.saleOrder?.orderNo} — {fallbackName}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground/60">
            {formatRelativeTime(notification.createdAt, lang)}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/40 px-3 py-2 text-center sm:text-left">
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </p>
      <p className={cn('text-lg font-semibold text-foreground', accent)}>
        {value}
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border/60 bg-background/30 px-6 py-12 text-center">
      <div className="rounded-full border border-border/60 bg-background/60 p-4">
        <Bell className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function IconForNotification({ read }: { read: boolean }) {
  if (read) {
    return <CheckCircle2 className="mt-0.5 h-4 w-4 text-muted-foreground/60" />;
  }
  return <Bell className="mt-0.5 h-4 w-4 text-primary" />;
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
