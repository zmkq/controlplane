import { MetadataRoute } from 'next';
import {
  APP_APPLE_TOUCH_ICON,
  APP_DEFAULT_THEME_COLOR,
  APP_DESCRIPTION,
  APP_NAME,
  APP_PWA_ICON_192,
  APP_PWA_ICON_512,
  APP_PWA_MASKABLE_ICON,
} from '@/lib/app-config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: APP_DEFAULT_THEME_COLOR,
    theme_color: APP_DEFAULT_THEME_COLOR,
    lang: 'en',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: APP_PWA_ICON_192,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: APP_PWA_ICON_512,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: APP_PWA_MASKABLE_ICON,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: APP_APPLE_TOUCH_ICON,
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'New Order',
        short_name: 'New Order',
        description: 'Create a new supplement order',
        url: '/sales/new',
        icons: [{ src: APP_PWA_ICON_192, sizes: '192x192' }],
      },
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'View the command center',
        url: '/dashboard',
        icons: [{ src: APP_PWA_ICON_192, sizes: '192x192' }],
      },
    ],
  };
}
