import { getProducts, getAgents } from './actions';
import { NewSalePageClient } from '@/components/sales/new-sale-page-client';

export default async function NewSalePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const [products, agents] = await Promise.all([
    getProducts(),
    getAgents(),
  ]);

  return (
    <NewSalePageClient
      products={products}
      agents={agents}
      initialData={params}
    />
  );
}
