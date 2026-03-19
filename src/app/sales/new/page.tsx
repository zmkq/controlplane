import { prisma } from '@/lib/prisma';
import { getProducts, getAgents } from './actions';
import { NewSalePageClient } from '@/components/sales/new-sale-page-client';

export default async function NewSalePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const [products, agents, limitedInventoryAgg, onDemandQueue] = await Promise.all([
    getProducts(),
    getAgents(),
    prisma.product.aggregate({
      _sum: { quantity: true },
    }),
    prisma.saleOrder.count({
      where: {
        fulfillmentMode: 'ON_DEMAND',
        status: {
          not: 'DELIVERED',
        },
      },
    }),
  ]);

  const limitedInventory = limitedInventoryAgg._sum.quantity ?? 0;

  return (
    <NewSalePageClient
      products={products}
      agents={agents}
      limitedInventory={limitedInventory}
      onDemandQueue={onDemandQueue}
      initialData={params}
    />
  );
}
