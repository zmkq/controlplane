'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/pwa/service-worker';
import { toast } from '@/lib/toast';
import { useTranslations } from '@/lib/i18n';

export function PwaProvider() {
  const { t } = useTranslations();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    registerServiceWorker({
      onSuccess: () => {
        console.log('[PWA] Service worker registered successfully');
      },
      onUpdate: () => {
        console.log('[PWA] New service worker available');
        // Optionally show update notification
        toast.info(
          t(
            'pwa.update.available',
            'A new version is available. Refresh to update.'
          )
        );
      },
      onError: (error) => {
        console.error('[PWA] Service worker registration failed:', error);
        // Don't show error toast as it might be expected in some browsers
      },
    });
  }, [t]);

  return null;
}
