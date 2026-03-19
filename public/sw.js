/**
 * Service Worker for Controlplane PWA
 * Handles caching, push notifications, and offline functionality
 */

const CACHE_VERSION = 'controlplane-v1';
const CACHE_NAME = `${CACHE_VERSION}-cache`;
const OFFLINE_PAGE = '/offline';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/offline',
  '/icons/icon-192.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(
          STATIC_ASSETS.map((url) => new Request(url, { cache: 'reload' })),
        );
      })
      .then(() => {
        console.log('[SW] Service worker installed');

        // Check if this is an update (not first install)
        return self.clients.matchAll({ type: 'window' }).then((clients) => {
          if (clients.length > 0) {
            // This is an update, show notification
            console.log('[SW] Update detected, showing notification');
            return self.registration.showNotification('Update Available', {
              body: 'A new version of Controlplane is ready. Click to update.',
              icon: '/icons/icon-192.png',
              badge: '/icons/icon-192.png',
              tag: 'app-update',
              requireInteraction: true,
              vibrate: [200, 100, 200],
              data: {
                type: 'APP_UPDATE',
                url: '/',
              },
              actions: [
                {
                  action: 'update',
                  title: 'Update Now',
                },
                {
                  action: 'dismiss',
                  title: 'Later',
                },
              ],
            });
          }
        });
      })
      .then(() => {
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            }),
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim(); // Take control of all pages immediately
      })
      .catch((error) => {
        console.error('[SW] Activation failed:', error);
      }),
  );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API calls - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return error response if no cache
            return new Response(
              JSON.stringify({ error: 'Network error and no cache available' }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' },
              },
            );
          });
        }),
    );
    return;
  }

  // Static assets - Cache first, fallback to network
  if (
    url.pathname.match(
      /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/,
    ) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches
        .match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((response) => {
            // Don't cache if not successful
            if (!response.ok) {
              return response;
            }
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
            return response;
          });
        })
        .catch(() => {
          // Return offline fallback for images
          if (request.destination === 'image') {
            return new Response('', { status: 404 });
          }
          return caches.match(OFFLINE_PAGE);
        }),
    );
    return;
  }

  // HTML pages - Network first, fallback to offline page
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful HTML responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to offline page
          return caches.match(OFFLINE_PAGE);
        });
      }),
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');

  let notificationData = {
    title: 'Controlplane',
    body: 'You have a new notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'default',
    data: {
      url: '/',
    },
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || data.notificationId || notificationData.tag,
        requireInteraction: data.requireInteraction || false,
        data: {
          notificationId: data.notificationId,
          saleOrderId: data.saleOrderId,
          url: data.saleOrderId
            ? `/sales/${data.saleOrderId}`
            : data.url || '/',
        },
      };
    } catch (error) {
      console.error('[SW] Failed to parse push data:', error);
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction,
    data: notificationData.data,
    vibrate: [100, 50, 100],
    silent: false,
  };

  event.waitUntil(
    self.registration
      .showNotification(notificationData.title, notificationOptions)
      .then(() => {
        console.log('[SW] Notification displayed:', notificationData.title);
      })
      .catch((error) => {
        console.error('[SW] Failed to show notification:', error);
      }),
  );
});

// Notification click event - handle user clicking on notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');

  event.notification.close();

  const notificationData = event.notification.data || {};

  // Handle app update notification
  if (notificationData.type === 'APP_UPDATE') {
    if (event.action === 'update') {
      // Skip waiting and reload all clients
      event.waitUntil(
        self.skipWaiting().then(() => {
          return self.clients.matchAll({ type: 'window' }).then((clients) => {
            clients.forEach((client) => {
              client.postMessage({ type: 'RELOAD_FOR_UPDATE' });
            });
          });
        }),
      );
    }
    // If action is 'dismiss' or just clicking the notification, do nothing
    return;
  }

  // Handle regular notifications
  const urlToOpen = notificationData.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If no existing window, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
      .catch((error) => {
        console.error('[SW] Failed to handle notification click:', error);
      }),
  );
});

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      }),
    );
  }
});
