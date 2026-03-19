import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import { APP_NAME } from '@/lib/app-config';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-cairo',
});

export const metadata: Metadata = {
  title: `تفاصيل الطلب | ${APP_NAME}`,
  description: `عرض تفاصيل طلبك من ${APP_NAME}`,
};

export default function CustomerSaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`${cairo.variable} font-cairo`}>{children}</div>;
}
