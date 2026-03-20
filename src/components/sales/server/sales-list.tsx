import { Prisma } from '@prisma/client';
import { fetchSalesWithFilters } from '@/lib/cache';
import { SalesListClient } from '@/components/sales/client/sales-list-client';
import { GlassSkeleton } from '@/components/ui/glass-skeleton';

type SalesListProps = {
  channelFilter: string;
  fulfillmentFilter: string;
  searchQuery: string;
  currentPage: number;
};

export async function SalesList({
  channelFilter,
  fulfillmentFilter,
  searchQuery,
  currentPage,
}: SalesListProps) {
  const pageSize = 10;

  // Construct Where Clause
  const where: Prisma.SaleOrderWhereInput = {};

  if (channelFilter !== 'all') {
    where.channel = { equals: channelFilter, mode: 'insensitive' };
  }

  if (fulfillmentFilter !== 'all') {
    if (fulfillmentFilter === 'on-demand') {
      where.fulfillmentMode = 'ON_DEMAND';
    } else {
      where.fulfillmentMode = { not: 'ON_DEMAND' };
    }
  }

  if (searchQuery) {
    where.OR = [
      { customer: { name: { contains: searchQuery, mode: 'insensitive' } } },
      { orderNo: { contains: searchQuery, mode: 'insensitive' } },
      { id: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  const { sales, totalCount } = await fetchSalesWithFilters(where as Record<string, unknown>, currentPage, pageSize);
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <SalesListClient
      sales={sales}
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      channelFilter={channelFilter}
      fulfillmentFilter={fulfillmentFilter}
      searchQuery={searchQuery}
    />
  );
}

export function SalesListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <GlassSkeleton className="h-12 w-full rounded-[1.25rem] xl:max-w-md" />
          <div className="flex flex-wrap gap-2 xl:justify-end">
            {Array.from({ length: 6 }).map((_, index) => (
              <GlassSkeleton
                key={index}
                className="h-10 min-w-24 rounded-xl border border-white/5"
              />
            ))}
          </div>
        </div>
      </div>

      {[1, 2, 3, 4, 5].map((i) => (
        <GlassSkeleton
          key={i}
          className="h-32 w-full rounded-[2rem] border border-white/5"
        />
      ))}
    </div>
  );
}
