'use client';

import { useTranslations } from '@/lib/i18n';
import NewSaleForm from '@/app/sales/new/form';

type Option = { value: string; label: string };
type ProductOption = Option & { cost: number; imageUrl?: string | null; isBundle?: boolean; price?: number };
type AgentOption = Option & { leadTime: number };

type NewSalePageClientProps = {
  products: ProductOption[];
  agents: AgentOption[];
  initialData?: { [key: string]: string | string[] | undefined };
};

export function NewSalePageClient({
  products,
  agents,
  initialData,
}: NewSalePageClientProps) {
  const { t } = useTranslations();

  return (
    <div className="space-y-6 px-4 pb-24 pt-6 sm:px-6 lg:px-10">
      <div className="flex flex-col gap-2">
        <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
          {t('newSale.header.tradingFloor', 'Trading Floor')}
        </p>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          <span className="text-foreground">{t('newSale.header.new', 'New')}</span>{' '}
          <span className="text-premium-gradient">{t('newSale.header.order', 'Order')}</span>
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground/80">
          {t('newSale.header.subtitle', 'Capture the channel, stack the items, pick fulfillment, then review — optimized for high-speed entry.')}
        </p>
      </div>
      <NewSaleForm
        products={products}
        agents={agents}
        initialData={initialData}
      />
    </div>
  );
}
