'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { registerServiceWorker, sendMessageToServiceWorker } from '@/lib/pwa/service-worker';
import { APP_NAME } from '@/lib/app-config';

export function PWAUpdateToast() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const handleUpdate = () => {
    sendMessageToServiceWorker({ type: 'SKIP_WAITING' });
  };

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Listen for reload messages from service worker
    const messageHandler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'RELOAD_FOR_UPDATE') {
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('message', messageHandler);

    // Register service worker with update callback
    registerServiceWorker({
      onUpdate: (registration) => {
        console.log('[PWA] Update available');
        registrationRef.current = registration;

        toast(`${APP_NAME} update available`, {
          description: 'Refresh into the latest build when you are ready.',
          action: {
            label: 'Update',
            onClick: handleUpdate,
          },
          duration: Infinity,
        });
      },
      onSuccess: (registration) => {
        console.log('[PWA] Service worker registered successfully');
        registrationRef.current = registration;
      },
      onError: (error) => {
        console.error('[PWA] Service worker registration failed:', error);
      },
    });

    const interval = setInterval(() => {
      if (registrationRef.current) {
        registrationRef.current.update();
      }
    }, 60000);

    return () => {
      clearInterval(interval);
      navigator.serviceWorker.removeEventListener('message', messageHandler);
    };
  }, []);

  return null;
}
