import { prisma } from '@/lib/prisma';
import webPush, { WebPushError } from 'web-push';
import { APP_NAME, APP_PWA_ICON_192 } from '@/lib/app-config';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:push@controlplane.local';

export const isPushConfigured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (isPushConfigured) {
  webPush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY as string,
    VAPID_PRIVATE_KEY as string,
  );
  console.log('[Push] VAPID keys configured');
} else {
  console.warn('[Push] VAPID keys missing - push notifications disabled');
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  notificationId?: string;
  saleOrderId?: string | null;
  url?: string;
  requireInteraction?: boolean;
}

/**
 * Broadcast push notification to all registered devices
 */
export async function broadcastPushNotification(
  payload: PushNotificationPayload,
): Promise<{ sent: number; failed: number }> {
  if (!isPushConfigured) {
    console.warn('[Push] VAPID keys missing – skipping broadcast');
    return { sent: 0, failed: 0 };
  }

  try {
    const subscriptions = await prisma.pushSubscription.findMany();
    console.log(`[Push] Broadcasting to ${subscriptions.length} device(s)`);

    if (subscriptions.length === 0) {
      console.warn(
        '[Push] No push subscriptions found. Users need to enable notifications first.',
      );
      return { sent: 0, failed: 0 };
    }

    // Prepare notification payload
    const notificationPayload: PushNotificationPayload = {
      title: payload.title || APP_NAME,
      body: payload.body || 'You have a new notification',
      icon: payload.icon || APP_PWA_ICON_192,
      badge: payload.badge || APP_PWA_ICON_192,
      tag:
        payload.tag || `notification-${payload.notificationId || Date.now()}`,
      notificationId: payload.notificationId,
      saleOrderId: payload.saleOrderId,
      url:
        payload.url ||
        (payload.saleOrderId ? `/sales/${payload.saleOrderId}` : '/'),
      requireInteraction: payload.requireInteraction ?? false,
    };

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription, index) => {
        try {
          console.log(
            `[Push] Sending to device ${index + 1}/${
              subscriptions.length
            } (${subscription.endpoint.substring(0, 30)}...)`,
          );

          await webPush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                auth: subscription.auth,
                p256dh: subscription.p256dh,
              },
            },
            JSON.stringify(notificationPayload),
          );

          console.log(`[Push] ✓ Successfully sent to device ${index + 1}`);
          return { success: true, endpoint: subscription.endpoint };
        } catch (error) {
          const webPushError = error as WebPushError;
          const statusCode = webPushError.statusCode;

          console.error(`[Push] ✗ Failed to send to device ${index + 1}:`, {
            statusCode,
            message: webPushError.message,
            endpoint: subscription.endpoint.substring(0, 50),
          });

          // Remove invalid subscriptions (404 = not found, 410 = gone)
          if (statusCode === 404 || statusCode === 410) {
            console.log(`[Push] Removing invalid subscription (${statusCode})`);
            await prisma.pushSubscription.delete({
              where: { endpoint: subscription.endpoint },
            });
          }

          return {
            success: false,
            endpoint: subscription.endpoint,
            error: webPushError,
          };
        }
      }),
    );

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success,
    ).length;
    const failed = results.length - successful;

    console.log(
      `[Push] Broadcast complete: ${successful} succeeded, ${failed} failed`,
    );

    return { sent: successful, failed };
  } catch (error) {
    console.error('[Push] Broadcast failed:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Send push notification to a specific subscription
 */
export async function sendPushNotification(
  subscription: {
    endpoint: string;
    keys: {
      auth: string;
      p256dh: string;
    };
  },
  payload: PushNotificationPayload,
): Promise<void> {
  if (!isPushConfigured) {
    throw new Error('VAPID keys not configured');
  }

  await webPush.sendNotification(subscription, JSON.stringify(payload));
}
