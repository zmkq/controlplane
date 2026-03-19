'use client';

import { ProductsClient } from '@/components/products/products-client';
import { SearchInput } from '@/components/ui/search-input';
import { useTranslations } from '@/lib/i18n';

type ProductEntity = {
  id: string;
  name: string;
  sku: string;
  brand: string;
  flavor: string | null;
  size: string | null;
  active: boolean;
  cost: number;
  price?: number;
  quantity: number;
  updatedAt: string;
  fulfillmentMode: 'limited' | 'on-demand';
  attributes: any;
  images: string | null;
  isBundle: boolean;
  bundleItems?: any[];
  supplierId?: string;
  type: string;
};

type ProductsPageClientProps = {
  products: ProductEntity[];
  suppliers: { id: string; name: string }[];
  totalSkus: number;
  totalUnits: number;
  lowStockCount: number;
  inventoryValue: number;
  currentType: string;
  currentSupplier: string;
  currentFulfillmentMode: string;
};

export function ProductsPageClient({
  products,
  suppliers,
  totalSkus,
  totalUnits,
  lowStockCount,
  inventoryValue,
  currentType,
  currentSupplier,
  currentFulfillmentMode,
}: ProductsPageClientProps) {
  const { t } = useTranslations();

  return (
    <div className="space-y-8 px-4 pb-24 pt-8 sm:px-6 lg:px-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="tracking-widest uppercase">{t('products.hero.systemArmory', 'System Armory')}</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            {t('products.hero.title', 'Inventory Command')}
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            {t('products.hero.subtitle', 'Manage drops, edit specs, and monitor stock levels in real-time.')}
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
          icon="📦"
        />
        <MetricTile 
          label={t('products.metrics.units', 'Total Units')} 
          value={totalUnits.toString()} 
          icon="📊"
        />
        <MetricTile
          label={t('products.metrics.lowStock', 'Critical Stock')}
          value={lowStockCount.toString()}
          sublabel={t('products.metrics.lowStockSub', '≤ 5 units')}
          icon="⚠️"
          isWarning={lowStockCount > 0}
        />
      </div>

      {/* Search Input */}
      <div className="max-w-md">
        <SearchInput placeholder={t('products.searchPlaceholder', 'Search products, SKUs, or brands...')} />
      </div>

      <ProductsClient 
        products={products} 
        suppliers={suppliers}
        currentType={currentType}
        currentSupplier={currentSupplier}
        currentFulfillmentMode={currentFulfillmentMode}
      />
    </div>
  );
}

function MetricTile({
  label,
  value,
  sublabel,
  icon,
  isWarning
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: string;
  isWarning?: boolean;
}) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border bg-background/40 p-5 transition-all hover:bg-background/60 ${isWarning ? 'border-destructive/50 bg-destructive/5' : 'border-white/5'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </p>
          <p className={`mt-2 text-3xl font-bold ${isWarning ? 'text-destructive' : 'text-foreground'}`}>{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg ${isWarning ? 'border-destructive/30 bg-destructive/10' : 'border-white/10 bg-white/5'}`}>
          {icon}
        </div>
      </div>
      {sublabel && (
        <div className="mt-3 flex items-center gap-2">
          {isWarning && <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
          </span>}
          <p className="text-xs font-medium text-muted-foreground">{sublabel}</p>
        </div>
      )}
      
      {/* Glass Shine Effect */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}
