import { prisma } from '@/lib/prisma';
import { Prisma, ProductType } from '@prisma/client';
import { ProductsClient } from '@/components/products/products-client';
import {
  getProductFulfillmentMode,
  matchesProductFulfillmentMode,
  matchesProductStatus,
  matchesProductStock,
} from '@/lib/product-filters';

type SearchParams = Record<string, string | string[] | undefined>;

export async function ProductList({ searchParams }: { searchParams: SearchParams }) {
  const queryValue = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q;
  const typeValue = Array.isArray(searchParams.type) ? searchParams.type[0] : searchParams.type;
  const supplierValue = Array.isArray(searchParams.supplier) ? searchParams.supplier[0] : searchParams.supplier;
  const fulfillmentModeValue = Array.isArray(searchParams.fulfillmentMode) ? searchParams.fulfillmentMode[0] : searchParams.fulfillmentMode;
  const statusValue = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status;
  const stockValue = Array.isArray(searchParams.stock) ? searchParams.stock[0] : searchParams.stock;
  const searchQuery = queryValue ?? '';

  const where: Prisma.ProductWhereInput = {};
  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { sku: { contains: searchQuery, mode: 'insensitive' } },
      { brand: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }
  
  if (typeValue) where.type = typeValue as ProductType;
  if (supplierValue) where.supplierProducts = { some: { supplierId: supplierValue } };

  const [products, suppliers] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        bundleItems: {
          select: {
            productId: true,
            quantity: true,
          },
        },
        supplierProducts: {
          select: {
            supplierId: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.supplier.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
  ]);

  const serializedProducts = products
    .filter((product) =>
      matchesProductFulfillmentMode(product.attributes, fulfillmentModeValue) &&
      matchesProductStatus(product.active, statusValue) &&
      matchesProductStock(Number(product.quantity ?? 0), product.attributes, stockValue)
    )
    .map((product) => {
      const normalizedAttributes =
        product.attributes &&
        typeof product.attributes === 'object' &&
        !Array.isArray(product.attributes)
          ? (product.attributes as { shakerCount?: number })
          : undefined;

      return {
        ...product,
        cost: Number(product.cost ?? 0),
        price: product.price ? Number(product.price) : undefined,
        updatedAt: product.updatedAt.toISOString(),
        fulfillmentMode: getProductFulfillmentMode(product.attributes),
        attributes: normalizedAttributes,
        bundleItems: product.bundleItems,
        supplierId: product.supplierProducts[0]?.supplierId,
      };
    });

  return (
    <ProductsClient
      products={serializedProducts}
      suppliers={suppliers}
      currentQuery={searchQuery}
      currentType={typeValue || ''}
      currentSupplier={supplierValue || ''}
      currentFulfillmentMode={fulfillmentModeValue || ''}
      currentStatus={statusValue || ''}
      currentStock={stockValue || ''}
    />
  );
}

export function ProductListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
      ))}
    </div>
  );
}
