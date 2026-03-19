import { Prisma } from '@prisma/client';
import { fetchSalesWithFilters } from '@/lib/cache';
import { SalesListClient } from '@/components/sales/client/sales-list-client';

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
    <div className="space-y-4">
       {/* Fake Filter Bar */}
       <div className="h-16 w-full rounded-3xl border border-white/5 bg-white/5 animate-pulse" />
       
       {/* Fake List Items */}
       {[1, 2, 3, 4, 5].map((i) => (
         <div key={i} className="h-24 w-full rounded-[2rem] bg-white/5 animate-pulse" />
       ))}
    </div>
  );
}
