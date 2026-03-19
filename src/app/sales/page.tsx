import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getServerTranslations } from '@/lib/server-i18n';
import { SalesMetrics, SalesMetricsSkeleton } from '@/components/sales/server/sales-metrics';
import { SalesList, SalesListSkeleton } from '@/components/sales/server/sales-list';

type SearchParams = Record<string, string | string[] | undefined>;
type SalesPageProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const params = (await searchParams) ?? {};
  const t = await getServerTranslations();

  const channelValue = Array.isArray(params.channel) ? params.channel[0] : params.channel;
  const fulfillmentValue = Array.isArray(params.fulfillment) ? params.fulfillment[0] : params.fulfillment;
  const pageValue = Array.isArray(params.page) ? params.page[0] : params.page;
  const queryValue = Array.isArray(params.q) ? params.q[0] : params.q;
  
  const channelFilter = (channelValue ?? 'all').toLowerCase();
  const fulfillmentFilter = (fulfillmentValue ?? 'all').toLowerCase();
  const currentPage = Number(pageValue ?? '1');
  const searchQuery = queryValue ?? '';

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8 px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
            {t('saleDetail.tradingFloor', 'Trading Floor')}
          </p>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            <span className="text-foreground">{t('sidebar.nav.sales', 'Sales')}</span>{' '}
            <span className="text-premium-gradient">{t('saleDetail.ledger.title', 'Ledger')}</span>
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground/80">
            {t('sales.heroSubtitle', 'Real-time order tracking and fulfillment management.')}
          </p>
        </div>
        <Link
          href="/sales/new"
          className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-8 font-bold text-primary-foreground transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(219,236,10,0.4)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <Plus className="h-5 w-5" />
          {t('nav.cta', 'New Order')}
        </Link>
      </div>

      <Suspense fallback={<SalesMetricsSkeleton />}>
        <SalesMetrics />
      </Suspense>

      <Suspense fallback={<SalesListSkeleton />}>
        <SalesList 
          channelFilter={channelFilter}
          fulfillmentFilter={fulfillmentFilter}
          searchQuery={searchQuery}
          currentPage={currentPage}
        />
      </Suspense>
    </div>
  );
}
