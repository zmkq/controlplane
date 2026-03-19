import { toast as sonnerToast } from 'sonner';

/**
 * Unified toast utility for consistent feedback across the app
 * Uses sonner under the hood with Controlplane styling
 */
export const toast = {
  success: (message: string, options?: { description?: string; duration?: number; id?: string | number }) => {
    return sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
      id: options?.id,
    });
  },

  error: (message: string, options?: { description?: string; duration?: number; id?: string | number }) => {
    return sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration ?? 5000,
      id: options?.id,
    });
  },

  loading: (message: string, options?: { description?: string; id?: string | number }) => {
    return sonnerToast.loading(message, {
      description: options?.description,
      id: options?.id,
    });
  },

  info: (message: string, options?: { description?: string; duration?: number; id?: string | number }) => {
    return sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
      id: options?.id,
    });
  },

  warning: (message: string, options?: { description?: string; duration?: number; id?: string | number }) => {
    return sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration ?? 4000,
      id: options?.id,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return sonnerToast.promise(promise, messages);
  },

  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};

