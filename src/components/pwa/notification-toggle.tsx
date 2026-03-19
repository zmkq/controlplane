'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/lib/i18n';
import { toast } from '@/lib/toast';
import {
  isPushNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getPushSubscription,
  subscriptionToJSON,
} from '@/lib/pwa/push-notifications';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

export function NotificationToggle({ className }: { className?: string } = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslations();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported = isPushNotificationSupported();
    setIsSupported(supported);

    if (supported) {
      setPermission(getNotificationPermission());
      checkSubscriptionStatus();
    }
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const subscription = await getPushSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('[Push] Failed to check subscription status:', error);
    }
  };

  const handleToggle = async () => {
    if (!isSupported) {
      toast.error(
        t(
          'pwa.notifications.notSupported',
          'Push notifications are not supported in this browser'
        )
      );
      return;
    }

    if (!VAPID_PUBLIC_KEY) {
      toast.error(
        t(
          'pwa.notifications.configError',
          'Push notifications are not configured'
        )
      );
      return;
    }

    setIsLoading(true);

    try {
      if (isSubscribed) {
        // Unsubscribe
        const subscription = await getPushSubscription();
        if (subscription) {
          const result = await unsubscribeFromPushNotifications();
          if (result) {
            // Remove from server
            const subData = subscriptionToJSON(subscription);
            await fetch('/api/push/unsubscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ endpoint: subData.endpoint }),
            });
            setIsSubscribed(false);
            toast.success(
              t('pwa.notifications.unsubscribed', 'Notifications disabled')
            );
          }
        }
      } else {
        // Subscribe
        // First check permission
        let currentPermission = getNotificationPermission();
        if (currentPermission !== 'granted') {
          currentPermission = await requestNotificationPermission();
          setPermission(currentPermission);
        }

        if (currentPermission !== 'granted') {
          toast.error(
            t(
              'pwa.notifications.permissionDenied',
              'Notification permission was denied'
            )
          );
          setIsLoading(false);
          return;
        }

        // Subscribe
        const subscription = await subscribeToPushNotifications(
          VAPID_PUBLIC_KEY
        );
        if (subscription) {
          // Send to server
          const subData = subscriptionToJSON(subscription);
          
          // Detect device info
          const userAgent = navigator.userAgent;
          let deviceType = 'desktop';
          if (/iPad|Android(?!.*Mobile)/i.test(userAgent)) deviceType = 'tablet';
          else if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) deviceType = 'mobile';
          
          let deviceName = 'Unknown Device';
          if (userAgent.includes('iPhone')) deviceName = 'iPhone';
          else if (userAgent.includes('iPad')) deviceName = 'iPad';
          else if (userAgent.includes('Android')) deviceName = 'Android Device';
          else if (userAgent.includes('Mac')) deviceName = 'Mac';
          else if (userAgent.includes('Windows')) deviceName = 'Windows PC';

          const payload = {
            ...subData,
            deviceName,
            deviceType,
            userAgent,
          };

          const response = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error('Failed to save subscription');
          }

          setIsSubscribed(true);
          toast.success(
            t('pwa.notifications.subscribed', 'Notifications enabled')
          );
        }
      }
    } catch (error) {
      console.error('[Push] Toggle error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : t('pwa.notifications.error', 'Failed to toggle notifications')
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background/40 px-3 py-2 text-sm text-muted-foreground">
          <BellOff className="h-4 w-4" />
          <span>{t('pwa.notifications.notSupported', 'Not supported')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Button
        variant={isSubscribed ? 'default' : 'outline'}
        onClick={handleToggle}
        disabled={isLoading || permission === 'denied'}
        className={`w-full justify-start gap-2 ${
          isSubscribed ? 'brand-glow' : ''
        }`}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t('pwa.notifications.loading', 'Loading...')}</span>
          </>
        ) : isSubscribed ? (
          <>
            <Bell className="h-4 w-4" />
            <span>
              {t('pwa.notifications.enabled', 'Notifications enabled')}
            </span>
          </>
        ) : (
          <>
            <BellOff className="h-4 w-4" />
            <span>
              {t('pwa.notifications.disabled', 'Enable notifications')}
            </span>
          </>
        )}
      </Button>
      {permission === 'denied' && (
        <p className="mt-2 text-xs text-destructive">
          {t(
            'pwa.notifications.permissionDenied',
            'Notification permission was denied. Please enable it in your browser settings.'
          )}
        </p>
      )}
    </div>
  );
}
