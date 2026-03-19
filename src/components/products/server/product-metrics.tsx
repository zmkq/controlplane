import { Prisma, ProductType } from '@prisma/client';
import {
  AlertTriangle,
  Boxes,
  Package2,
  type LucideIcon,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import {
  getProductFulfillmentMode,
  matchesProductFulfillmentMode,
  matchesProductStatus,
  matchesProductStock,
  LOW_STOCK_THRESHOLD,
} from '@/lib/product-filters';
import { getServerTranslations } from '@/lib/server-i18n';

type SearchParams = Record<string, string | string[] | undefined>;

export async function ProductMetrics({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getServerTranslations();

  const queryValue = Array.isArray(searchParams.q)
    ? searchParams.q[0]
    : searchParams.q;
  const typeValue = Array.isArray(searchParams.type)
    ? searchParams.type[0]
    : searchParams.type;
  const supplierValue = Array.isArray(searchParams.supplier)
    ? searchParams.supplier[0]
    : searchParams.supplier;
  const fulfillmentModeValue = Array.isArray(searchParams.fulfillmentMode)
    ? searchParams.fulfillmentMode[0]
    : searchParams.fulfillmentMode;
  const statusValue = Array.isArray(searchParams.status)
    ? searchParams.status[0]
    : searchParams.status;
  const stockValue = Array.isArray(searchParams.stock)
    ? searchParams.stock[0]
    : searchParams.stock;
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
  if (supplierValue) {
    where.supplierProducts = { some: { supplierId: supplierValue } };
  }

  const products = await prisma.product.findMany({
    where,
    select: {
      active: true,
      quantity: true,
      cost: true,
      attributes: true,
    },
  });

  const filteredProducts = products.filter((product) =>
    matchesProductFulfillmentMode(product.attributes, fulfillmentModeValue) &&
    matchesProductStatus(product.active, statusValue) &&
    matchesProductStock(Number(product.quantity ?? 0), product.attributes, stockValue)
  );

  const totalSkus = filteredProducts.length;
  const totalUnits = filteredProducts.reduce(
    (acc, product) => acc + Math.max(Number(product.quantity ?? 0), 0),
    0
  );
  const lowStockCount = filteredProducts.filter(
    (product) =>
      getProductFulfillmentMode(product.attributes) === 'limited' &&
      Number(product.quantity ?? 0) > 0 &&
      Number(product.quantity ?? 0) <= LOW_STOCK_THRESHOLD
  ).length;
  const inventoryValue = filteredProducts.reduce(
    (acc, product) =>
      acc + Number(product.quantity ?? 0) * Number(product.cost ?? 0),
    0
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            <span className="tracking-widest uppercase">
              {t('products.hero.systemArmory', 'System Armory')}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            {t('products.hero.title', 'Inventory Command')}
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            {t(
              'products.hero.subtitle',
              'Manage drops, edit specs, and monitor stock levels in real-time.',
            )}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {t('products.hero.valuation', 'Total Valuation')}
            </p>
            <p className="text-holographic text-2xl font-bold">
              {t('common.currency.jod', 'JOD')} {inventoryValue.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile
          label={t('products.metrics.skus', 'Active SKUs')}
          value={totalSkus.toString()}
          icon={Package2}
        />
        <MetricTile
          label={t('products.metrics.units', 'Total Units')}
          value={totalUnits.toString()}
          icon={Boxes}
        />
        <MetricTile
          label={t('products.metrics.lowStock', 'Critical Stock')}
          value={lowStockCount.toString()}
          sublabel={t('products.metrics.lowStockSub', '<= 5 units')}
          icon={AlertTriangle}
          isWarning={lowStockCount > 0}
        />
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  sublabel,
  icon: Icon,
  isWarning,
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: LucideIcon;
  isWarning?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-background/40 p-5 transition-all hover:bg-background/60 ${isWarning ? 'border-destructive/50 bg-destructive/5' : 'border-white/5'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </p>
          <p
            className={`mt-2 text-3xl font-bold ${isWarning ? 'text-destructive' : 'text-foreground'}`}>
            {value}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${isWarning ? 'border-destructive/30 bg-destructive/10' : 'border-white/10 bg-white/5'}`}>
          <Icon
            className={`h-5 w-5 ${isWarning ? 'text-destructive' : 'text-primary'}`}
          />
        </div>
      </div>
      {sublabel && (
        <div className="mt-3 flex items-center gap-2">
          {isWarning && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
            </span>
          )}
          <p className="text-xs font-medium text-muted-foreground">
            {sublabel}
          </p>
        </div>
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

export function ProductMetricsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
          <div className="h-10 w-64 animate-pulse rounded bg-white/5" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}
