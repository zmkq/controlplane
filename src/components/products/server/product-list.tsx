import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ProductsClient } from '@/components/products/products-client';

type SearchParams = Record<string, string | string[] | undefined>;

export async function ProductList({ searchParams }: { searchParams: SearchParams }) {
  const queryValue = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q;
  const typeValue = Array.isArray(searchParams.type) ? searchParams.type[0] : searchParams.type;
  const supplierValue = Array.isArray(searchParams.supplier) ? searchParams.supplier[0] : searchParams.supplier;
  const fulfillmentModeValue = Array.isArray(searchParams.fulfillmentMode) ? searchParams.fulfillmentMode[0] : searchParams.fulfillmentMode;
  const searchQuery = queryValue ?? '';

  const where: Prisma.ProductWhereInput = {};
  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { sku: { contains: searchQuery, mode: 'insensitive' } },
      { brand: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }
  
  if (typeValue) where.type = typeValue as any;
  if (supplierValue) where.supplierProducts = { some: { supplierId: supplierValue } };

  const [products, suppliers] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.supplier.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
  ]);

  const serializedProducts = products.map((product) => {
    const attributes =
      product.attributes && typeof product.attributes === 'object' && !Array.isArray(product.attributes)
        ? (product.attributes as any as { fulfillmentMode?: string })
        : {};
    const fulfillmentMode: 'limited' | 'on-demand' =
      attributes.fulfillmentMode === 'on-demand' ? 'on-demand' : 'limited';
    return {
      ...product,
      cost: Number(product.cost ?? 0),
      price: product.price ? Number(product.price) : undefined,
      updatedAt: product.updatedAt.toISOString(),
      fulfillmentMode,
      attributes: product.attributes as any,
    };
  });

  return (
    <ProductsClient
      products={serializedProducts}
      suppliers={suppliers}
      currentType={typeValue || ''}
      currentSupplier={supplierValue || ''}
      currentFulfillmentMode={fulfillmentModeValue || ''}
    />
  );
}

export function ProductListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
      ))}
    </div>
  );
}
