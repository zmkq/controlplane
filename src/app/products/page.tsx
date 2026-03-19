import { Suspense } from 'react';
import { getServerTranslations } from '@/lib/server-i18n';
import { ProductMetrics, ProductMetricsSkeleton } from '@/components/products/server/product-metrics';
import { ProductList, ProductListSkeleton } from '@/components/products/server/product-list';
import { SearchInput } from '@/components/ui/search-input';

type SearchParams = Record<string, string | string[] | undefined>;
type ProductsPageProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = (await searchParams) ?? {};
  const t = await getServerTranslations();

  return (
    <div className="space-y-8 px-4 pb-24 pt-8 sm:px-6 lg:px-10">
      
      <Suspense fallback={<ProductMetricsSkeleton />}>
        <ProductMetrics searchParams={params} />
      </Suspense>

      {/* Search Input */}
      <div className="max-w-md">
        <SearchInput placeholder={t('products.searchPlaceholder', 'Search products, SKUs, or brands...')} />
      </div>

      <Suspense fallback={<ProductListSkeleton />}>
        <ProductList searchParams={params} />
      </Suspense>
    </div>
  );
}
