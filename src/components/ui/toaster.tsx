'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { useTranslations } from '@/lib/i18n';

export function Toaster() {
  const { lang } = useTranslations();

  return (
    <SonnerToaster
      position="top-right"
      dir={'ltr'}
      toastOptions={{
        classNames: {
          toast:
            'glass-panel rounded-2xl border border-border/60 bg-background/95 backdrop-blur-2xl shadow-[0_20px_45px_rgba(0,0,0,0.45)]',
          title: 'text-foreground font-semibold text-sm',
          description: 'text-muted-foreground text-xs',
          actionButton: 'brand-glow rounded-xl px-3 py-2 text-xs font-semibold',
          cancelButton:
            'rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground',
          closeButton:
            'rounded-full border border-border/60 bg-background/50 text-muted-foreground hover:text-foreground',
          success: 'border-emerald-400/30 bg-emerald-400/10',
          error: 'border-destructive/40 bg-destructive/10',
          warning: 'border-primary/40 bg-primary/10',
          info: 'border-accent/40 bg-accent/10',
        },
      }}
      richColors
      expand={false}
      duration={4000}
    />
  );
}

