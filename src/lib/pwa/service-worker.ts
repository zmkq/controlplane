/**
 * Service Worker Registration Utility
 * Handles registration, updates, and error handling for the service worker
 */

export type ServiceWorkerState = 'installing' | 'installed' | 'activating' | 'activated' | 'redundant';

export interface ServiceWorkerRegistrationOptions {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

/**
 * Check if service workers are supported in the browser
 */
export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(
  options: ServiceWorkerRegistrationOptions = {}
): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.warn('[SW] Service workers are not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[SW] Service worker registered:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      console.log('[SW] New service worker found, installing...');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New service worker available
            console.log('[SW] New service worker installed, update available');
            options.onUpdate?.(registration);
          } else {
            // First time installation
            console.log('[SW] Service worker installed for the first time');
            options.onSuccess?.(registration);
          }
        }
      });
    });

    // Handle controller change (page refresh after update)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Service worker controller changed, reloading page...');
      window.location.reload();
    });

    options.onSuccess?.(registration);
    return registration;
  } catch (error) {
    console.error('[SW] Service worker registration failed:', error);
    options.onError?.(error as Error);
    return null;
  }
}

/**
 * Unregister the service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const result = await registration.unregister();
    console.log('[SW] Service worker unregistered:', result);
    return result;
  } catch (error) {
    console.error('[SW] Failed to unregister service worker:', error);
    return false;
  }
}

/**
 * Check for service worker updates
 */
export async function checkForUpdates(): Promise<void> {
  if (!isServiceWorkerSupported()) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    console.log('[SW] Checked for updates');
  } catch (error) {
    console.error('[SW] Failed to check for updates:', error);
  }
}

/**
 * Get the current service worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  try {
    return await navigator.serviceWorker.ready;
  } catch (error) {
    console.error('[SW] Failed to get service worker registration:', error);
    return null;
  }
}

/**
 * Send a message to the service worker
 */
export async function sendMessageToServiceWorker(message: unknown): Promise<void> {
  if (!isServiceWorkerSupported()) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      registration.active.postMessage(message);
    }
  } catch (error) {
    console.error('[SW] Failed to send message to service worker:', error);
  }
}

