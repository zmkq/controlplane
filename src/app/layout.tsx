import type { Metadata } from 'next';
import { Inter, Tajawal, Cairo, Montserrat } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { PwaProvider } from '@/components/pwa/pwa-provider';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { PWAUpdateToast } from '@/components/pwa-update-toast';
import { TranslationProvider } from '@/lib/i18n';
import { getAppSettings } from '@/lib/settings';
import { NavigationWrapper } from '@/components/navigation-wrapper';
import React, { type CSSProperties } from 'react';
import {
  APP_APPLE_TOUCH_ICON,
  APP_DESCRIPTION,
  APP_LOGO_PATH,
  APP_NAME,
} from '@/lib/app-config';
import { env } from '@/lib/env';
import { getDirection } from '@/lib/locale';
import { resolveLanguage } from '@/lib/server-locale';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['200', '300', '400', '500', '700', '800', '900'],
  variable: '--font-tajawal',
});
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-cairo',
});
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-montserrat',
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: APP_NAME,
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: APP_NAME,
  },
  icons: {
    icon: [{ url: APP_LOGO_PATH, type: 'image/svg+xml' }],
    apple: [{ url: APP_APPLE_TOUCH_ICON, sizes: '180x180' }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getAppSettings();
  const lang = await resolveLanguage();
  const accent = settings.brandColor ?? '#dbec0a';
  const bodyStyle = { '--primary': accent } as CSSProperties;

  return (
    <html lang={lang} data-lang={lang} dir={getDirection(lang)}>
      <body
        className={`${inter.variable} ${tajawal.variable} ${cairo.variable} ${montserrat.variable} bg-background text-foreground`}
        style={bodyStyle}>
        <TranslationProvider initialLang={lang}>
          <PwaProvider />
          <div className="relative flex min-h-screen flex-col bg-background">
            <a
              href="#main-content"
              className="sr-only focus-visible:not-sr-only focus-visible:brand-glow fixed left-1/2 top-2 z-[999] -translate-x-1/2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]">
              Skip to content
            </a>
            <NavigationWrapper>{children}</NavigationWrapper>
          </div>
          <InstallPrompt />
          <PWAUpdateToast />
          <Toaster />
        </TranslationProvider>
      </body>
    </html>
  );
}
