import { Prisma, ProductType } from '@prisma/client';
import {
  AlertTriangle,
  Boxes,
  Layers3,
  Package2,
  Radar,
  type LucideIcon,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { GlassSkeleton } from '@/components/ui/glass-skeleton';
import {
  LOW_STOCK_THRESHOLD,
  getProductFulfillmentMode,
  matchesProductFulfillmentMode,
  matchesProductStatus,
  matchesProductStock,
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

  const filteredProducts = products.filter(
    (product) =>
      matchesProductFulfillmentMode(product.attributes, fulfillmentModeValue) &&
      matchesProductStatus(product.active, statusValue) &&
      matchesProductStock(
        Number(product.quantity ?? 0),
        product.attributes,
        stockValue,
      ),
  );

  const totalSkus = filteredProducts.length;
  const totalUnits = filteredProducts.reduce(
    (acc, product) => acc + Math.max(Number(product.quantity ?? 0), 0),
    0,
  );
  const lowStockCount = filteredProducts.filter(
    (product) =>
      getProductFulfillmentMode(product.attributes) === 'limited' &&
      Number(product.quantity ?? 0) > 0 &&
      Number(product.quantity ?? 0) <= LOW_STOCK_THRESHOLD,
  ).length;
  const inventoryValue = filteredProducts.reduce(
    (acc, product) =>
      acc + Number(product.quantity ?? 0) * Number(product.cost ?? 0),
    0,
  );

  const activeFilters = [
    searchQuery && `Search: ${searchQuery}`,
    typeValue && `Type: ${typeValue.replaceAll('_', ' ')}`,
    supplierValue && `Supplier`,
    fulfillmentModeValue &&
      `Fulfillment: ${fulfillmentModeValue === 'on-demand' ? 'On-demand' : 'Limited'}`,
    statusValue && `Status: ${statusValue}`,
    stockValue && `Stock: ${stockValue.replaceAll('-', ' ')}`,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-8">
      <section className="glass-panel relative overflow-hidden rounded-[2rem] border border-white/10 px-5 py-5 sm:px-6 sm:py-6">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(98,195,255,0.16),transparent_58%)] lg:block" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_rgba(219,236,10,0.8)]" />
                {t('products.hero.systemArmory', 'System Armory')}
              </span>
              <span className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-primary">
                {t('products.hero.valuation', 'Total Valuation')} ·{' '}
                {t('common.currency.jod', 'JOD')} {inventoryValue.toFixed(2)}
              </span>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
                <span className="text-foreground">
                  {t('products.hero.title', 'Inventory Command')}
                </span>{' '}
                <span className="text-premium-gradient">
                  {t('products.hero.systemArmory', 'System Armory')}
                </span>
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                {t(
                  'products.hero.subtitle',
                  'Manage drops, edit specs, and monitor stock levels in real-time.',
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(activeFilters.length > 0 ? activeFilters : ['All inventory live']).map(
                (filter) => (
                  <span
                    key={filter}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground">
                    {filter}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:w-[34rem]">
            <HeroSignal
              icon={Radar}
              label={t('products.hero.filtersLive', 'Filters Live')}
              value={activeFilters.length.toString()}
              tone="primary"
            />
            <HeroSignal
              icon={Layers3}
              label={t('products.metrics.skus', 'Active SKUs')}
              value={totalSkus.toString()}
              tone="accent"
            />
            <HeroSignal
              icon={AlertTriangle}
              label={t('products.metrics.lowStock', 'Critical Stock')}
              value={lowStockCount.toString()}
              tone={lowStockCount > 0 ? 'danger' : 'accent'}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile
          label={t('products.metrics.skus', 'Active SKUs')}
          value={totalSkus.toString()}
          sublabel={t('products.metrics.skusSub', 'Catalog entries in view')}
          icon={Package2}
        />
        <MetricTile
          label={t('products.metrics.units', 'Total Units')}
          value={totalUnits.toString()}
          sublabel={t('products.metrics.unitsSub', 'Physical units ready to move')}
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

function HeroSignal({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: 'primary' | 'accent' | 'danger';
}) {
  const toneClass =
    tone === 'danger'
      ? 'text-destructive border-destructive/30 bg-destructive/10'
      : tone === 'accent'
        ? 'text-accent border-accent/20 bg-accent/10'
        : 'text-primary border-primary/20 bg-primary/10';

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        </div>
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
      <div className="glass-panel rounded-[2rem] border border-white/5 p-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <GlassSkeleton className="h-7 w-32 rounded-full" />
            <GlassSkeleton className="h-7 w-28 rounded-full" />
          </div>
          <GlassSkeleton className="h-10 w-full max-w-[22rem] rounded-2xl" />
          <GlassSkeleton className="h-4 w-full max-w-2xl" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <GlassSkeleton
                key={index}
                className="h-8 w-28 rounded-full border border-white/5"
              />
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <GlassSkeleton
            key={i}
            className="h-32 rounded-2xl border border-white/5"
          />
        ))}
      </div>
    </div>
  );
}
