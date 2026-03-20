'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';
import {
  ChevronDown,
  Filter,
  Globe2,
  Instagram,
  MessageCircleMore,
  Package,
  Plus,
  Printer,
  RefreshCw,
  ShoppingCart,
  Store,
  Truck,
  X,
  type LucideIcon,
} from 'lucide-react';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { SearchInput } from '@/components/ui/search-input';
import { getImgBBThumbnail } from '@/lib/imgbb';
import { useReactToPrint } from 'react-to-print';
import {
  ShipmentPrintView,
  type ShipmentPrintSale,
} from '@/components/sales/shipment-print-view';
import { useRef, useState, useTransition } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { EmptyStatePanel } from '@/components/ui/empty-state-panel';
import { bulkUpdateSaleStatus } from '@/app/sales/actions';
import { toast } from '@/lib/toast';
import { motion, AnimatePresence } from 'framer-motion';

type ShippingMeta = {
  deliveryMethod?: 'delivery' | 'pickup';
  address?: string;
  city?: string;
  contactNumber?: string;
  deliveryFee?: number;
  fulfillmentType?: 'limited' | 'on-demand';
  partnerName?: string;
  notes?: string;
};

type SaleLine = {
  id: string;
  quantity?: number | null;
  unitPrice?: number | string | null;
  product?: {
    name?: string | null;
    images?: string | null;
    sku?: string | null;
  } | null;
};

type SaleSummary = {
  id: string;
  orderNo: string;
  channel?: string | null;
  status?: string | null;
  total?: number | string | null;
  subtotal?: number | string | null;
  date: Date;
  fulfillmentMode?: 'ON_DEMAND' | string | null;
  shippingAddress?: Prisma.JsonValue | ShippingMeta | null;
  customer?: {
    name?: string | null;
    phone?: string | null;
  } | null;
  lines?: SaleLine[] | null;
};

type BulkStatus =
  | 'AWAITING_DELIVERY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'SUPPLIER_CONFIRMED'
  | 'CANCELED'
  | 'RETURNED';

type SalesListClientProps = {
  sales: SaleSummary[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  channelFilter: string;
  fulfillmentFilter: string;
  searchQuery: string;
};

const statusPalette: Record<string, string> = {
  delivered:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.2)]',
  awaiting_delivery:
    'border-primary/40 bg-primary/10 text-primary shadow-[0_0_10px_rgba(219,236,10,0.2)]',
  awaiting_supplier: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
  supplier_confirmed: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
  awaiting_partner: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
  out_for_delivery: 'border-primary/40 bg-primary/10 text-primary',
  packing: 'border-violet-400/30 bg-violet-400/10 text-violet-200',
  draft: 'border-white/10 bg-white/5 text-muted-foreground',
  canceled: 'border-destructive/40 bg-destructive/10 text-destructive',
  returned: 'border-destructive/40 bg-destructive/10 text-destructive',
};

const channelVisuals: Record<
  string,
  {
    icon: LucideIcon;
    tone: string;
    pillTone: string;
  }
> = {
  instagram: {
    icon: Instagram,
    tone: 'border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200',
    pillTone: 'border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200',
  },
  whatsapp: {
    icon: MessageCircleMore,
    tone: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    pillTone: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  },
  offline: {
    icon: Store,
    tone: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    pillTone: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  },
  facebook: {
    icon: Globe2,
    tone: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
    pillTone: 'border-sky-400/30 bg-sky-400/10 text-sky-200',
  },
};

function getChannelVisual(channel: string | null | undefined) {
  return channelVisuals[(channel ?? '').toLowerCase()] ?? channelVisuals.facebook;
}

function buildSalesHref(
  channel: string,
  fulfillment: string,
  query: string,
) {
  const params = new URLSearchParams();
  params.set('channel', channel);
  params.set('fulfillment', fulfillment);
  if (query) {
    params.set('q', query);
  }

  return `/sales?${params.toString()}`;
}

function toShippingMeta(
  value: Prisma.JsonValue | ShippingMeta | null | undefined,
): ShippingMeta {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as ShippingMeta;
}

export function SalesListClient({
  sales,
  totalCount,
  currentPage,
  totalPages,
  channelFilter,
  fulfillmentFilter,
  searchQuery,
}: SalesListClientProps) {
  const { t } = useTranslations();
  const router = useRouter();
  const [selectedSales, setSelectedSales] = useState<Set<string>>(new Set());
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [isPending, startTransition] = useTransition();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const toggleSelect = (id: string) => {
    const nextSelected = new Set(selectedSales);
    if (nextSelected.has(id)) {
      nextSelected.delete(id);
    } else {
      nextSelected.add(id);
    }
    setSelectedSales(nextSelected);
  };

  const toggleSelectAll = () => {
    if (selectedSales.size === sales.length) {
      setSelectedSales(new Set());
    } else {
      setSelectedSales(new Set(sales.map((sale) => sale.id)));
    }
  };

  const handleBulkStatusUpdate = (status: BulkStatus) => {
    const toastId = toast.loading('Updating order statuses...');

    startTransition(async () => {
      try {
        await bulkUpdateSaleStatus({
          ids: Array.from(selectedSales),
          status,
        });
        setSelectedSales(new Set());
        setShowStatusDropdown(false);
        router.refresh();
        toast.success('Order statuses updated', {
          id: toastId,
          description: `${statusOptions.find((option) => option.value === status)?.label ?? status} applied to the selected orders.`,
        });
      } catch (error) {
        console.error('Failed to update status:', error);
        toast.error('Failed to update order status', {
          id: toastId,
          description: 'Try again once the network settles.',
        });
      }
    });
  };

  const selectedSalesData = sales.filter((sale) => selectedSales.has(sale.id));
  const printableSales: ShipmentPrintSale[] = selectedSalesData.map((sale) => ({
    id: sale.id,
    orderNo: sale.orderNo,
    date: sale.date,
    customer: {
      name: sale.customer?.name ?? null,
      phone: sale.customer?.phone ?? null,
    },
    shippingAddress: toShippingMeta(sale.shippingAddress),
    lines: (sale.lines ?? []).map((line) => ({
      quantity: line.quantity ?? 0,
      unitPrice: line.unitPrice ?? 0,
      product: {
        name: line.product?.name ?? null,
        sku: line.product?.sku ?? null,
      },
    })),
    total: Number(sale.total ?? 0),
    subtotal:
      sale.subtotal === null || sale.subtotal === undefined
        ? undefined
        : Number(sale.subtotal),
    channel: sale.channel ?? undefined,
  }));
  const hasFilters =
    channelFilter !== 'all' || fulfillmentFilter !== 'all' || searchQuery !== '';
  const activeFilterCount = [
    channelFilter !== 'all',
    fulfillmentFilter !== 'all',
    searchQuery !== '',
  ].filter(Boolean).length;
  const allSelected = sales.length > 0 && selectedSales.size === sales.length;

  const statusOptions: Array<{
    value: BulkStatus;
    label: string;
    color: string;
  }> = [
    {
      value: 'AWAITING_DELIVERY',
      label: t('statuses.awaiting_delivery', 'Awaiting Delivery'),
      color: 'text-primary',
    },
    {
      value: 'OUT_FOR_DELIVERY',
      label: t('statuses.out_for_delivery', 'Out for Delivery'),
      color: 'text-primary',
    },
    {
      value: 'DELIVERED',
      label: t('statuses.delivered', 'Delivered'),
      color: 'text-emerald-400',
    },
    {
      value: 'SUPPLIER_CONFIRMED',
      label: t('statuses.supplier_confirmed', 'Partner Confirmed'),
      color: 'text-cyan-300',
    },
    {
      value: 'CANCELED',
      label: t('statuses.canceled', 'Canceled'),
      color: 'text-destructive',
    },
    {
      value: 'RETURNED',
      label: t('statuses.returned', 'Returned'),
      color: 'text-destructive',
    },
  ];

  const channelFilters = [
    {
      value: 'all',
      label: t('sales.filters.channels.all', 'All Channels'),
      icon: Filter,
    },
    {
      value: 'instagram',
      label: t('sales.filters.channels.instagram', 'Instagram'),
      icon: Instagram,
    },
    {
      value: 'whatsapp',
      label: t('sales.filters.channels.whatsapp', 'WhatsApp'),
      icon: MessageCircleMore,
    },
    {
      value: 'facebook',
      label: t('sales.filters.channels.facebook', 'Facebook'),
      icon: Globe2,
    },
    {
      value: 'offline',
      label: t('sales.filters.channels.offline', 'Offline'),
      icon: Store,
    },
  ];

  const fulfillmentFilters = [
    { value: 'all', label: t('sales.filters.fulfillment.all', 'All Types') },
    {
      value: 'limited',
      label: t('sales.filters.fulfillment.limited', 'Limited Stock'),
    },
    {
      value: 'on-demand',
      label: t('sales.filters.fulfillment.onDemand', 'On-Demand'),
    },
  ];
  const activeFilterLabels = [
    searchQuery && `Search: ${searchQuery}`,
    channelFilter !== 'all' &&
      `Channel: ${channelFilters.find((filter) => filter.value === channelFilter)?.label ?? channelFilter}`,
    fulfillmentFilter !== 'all' &&
      `Fulfillment: ${fulfillmentFilters.find((filter) => filter.value === fulfillmentFilter)?.label ?? fulfillmentFilter}`,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-8">
      <div className="hidden">
        <ShipmentPrintView ref={printRef} sales={printableSales} />
      </div>

      <AnimatePresence>
        {selectedSales.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-2xl md:bottom-8 md:left-1/2 md:right-auto md:-translate-x-1/2">
            <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/90 p-3 shadow-[0_0_40px_rgba(219,236,10,0.15)] backdrop-blur-xl md:flex-row md:items-center md:gap-3 md:px-5">
              <div className="flex items-center justify-between md:justify-start md:gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {selectedSales.size}
                  </div>
                  <span className="text-sm font-medium text-white">
                    {selectedSales.size === 1 ? 'order' : 'orders'} selected
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSales(new Set())}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-white md:hidden">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="hidden h-6 w-px bg-white/20 md:block" />

              <div className="flex items-center gap-2">
                <div className="relative flex-1 md:flex-none">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    disabled={isPending}
                    className="h-9 w-full gap-2 text-white hover:bg-white/10 hover:text-primary md:w-auto">
                    <RefreshCw
                      className={cn('h-4 w-4', isPending && 'animate-spin')}
                    />
                    <span className="hidden sm:inline">Update Status</span>
                    <span className="sm:hidden">Status</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>

                  <AnimatePresence>
                    {showStatusDropdown && (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setShowStatusDropdown(false)}
                          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
                        />

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-xl border border-white/10 bg-black/95 shadow-2xl backdrop-blur-xl md:left-0 md:right-auto md:w-56">
                          {statusOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleBulkStatusUpdate(option.value)}
                              disabled={isPending}
                              className={cn(
                                'w-full px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-white/10 disabled:opacity-50',
                                option.color,
                              )}>
                              {option.label}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <Button
                  size="sm"
                  onClick={() => handlePrint()}
                  disabled={isPending}
                  className="h-9 flex-1 gap-2 bg-white text-black hover:bg-white/90 md:flex-none">
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">Print Labels</span>
                  <span className="sm:hidden">Print</span>
                </Button>
              </div>

              <div className="hidden h-6 w-px bg-white/20 md:block" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSales(new Set())}
                className="hidden h-8 w-8 p-0 text-muted-foreground hover:text-white md:block">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-panel sticky top-[calc(var(--nav-height)+0.85rem)] z-30 rounded-[2rem] border border-white/10 p-4 sm:p-5">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                <ShoppingCart className="h-3.5 w-3.5 text-primary" />
                Order ledger
              </span>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {totalCount} total order{totalCount === 1 ? '' : 's'}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground">
                {activeFilterCount} active filter{activeFilterCount === 1 ? '' : 's'}
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              {hasFilters && (
                <Button asChild variant="outline">
                  <Link href="/sales">
                    <RefreshCw className="h-4 w-4" />
                    {t('common.clearFilters', 'Clear filters')}
                  </Link>
                </Button>
              )}

              <label className="flex min-h-11 items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <span className="leading-5">
                  {allSelected
                    ? 'All visible orders selected'
                    : 'Select all visible orders'}
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <SearchInput
              placeholder={t('common.buttons.search', 'Search...')}
              className="xl:max-w-md"
            />

            <div className="grid gap-3 lg:grid-cols-2 xl:flex-1">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-3">
                <div className="mb-3 flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  <Filter className="h-3.5 w-3.5 text-primary" />
                  Channels
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {channelFilters.map((filter) => {
                    const FilterIcon = filter.icon;

                    return (
                      <Link
                        key={filter.value}
                        href={buildSalesHref(
                          filter.value,
                          fulfillmentFilter,
                          searchQuery,
                        )}
                        className={cn(
                          'inline-flex min-w-fit items-center gap-2 rounded-xl border px-4 py-2 text-xs font-medium transition-all hover:scale-[1.02]',
                          channelFilter === filter.value
                            ? 'glass-active border-primary/30 text-primary shadow-[0_0_15px_rgba(219,236,10,0.1)]'
                            : 'border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground',
                        )}>
                        <FilterIcon className="h-3.5 w-3.5" />
                        {filter.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-3">
                <div className="mb-3 flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  <Truck className="h-3.5 w-3.5 text-accent" />
                  Fulfillment
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {fulfillmentFilters.map((filter) => (
                    <Link
                      key={filter.value}
                      href={buildSalesHref(
                        channelFilter,
                        filter.value,
                        searchQuery,
                      )}
                      className={cn(
                        'inline-flex min-w-fit items-center gap-2 rounded-xl border px-4 py-2 text-xs font-medium transition-all hover:scale-[1.02]',
                        fulfillmentFilter === filter.value
                          ? 'glass-active border-accent/30 text-accent shadow-[0_0_15px_rgba(98,195,255,0.1)]'
                          : 'border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground',
                      )}>
                      {filter.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {hasFilters && (
            <div className="flex flex-wrap gap-2 rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-3">
              {activeFilterLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground">
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {sales.length === 0 ? (
          <EmptyStatePanel
            icon={ShoppingCart}
            eyebrow={t('sales.emptyEyebrow', 'Order queue')}
            title={
              hasFilters
                ? t('sales.emptyFiltered', 'No orders match the current view')
                : t('sales.empty', 'No orders found')
            }
            description={
              hasFilters
                ? t(
                    'sales.emptyFilteredHint',
                    'Clear one or more filters to widen the ledger, or open a fresh order from here.',
                  )
                : t(
                    'sales.emptyHint',
                    'Start with a new order to populate the live ledger, print queue, and delivery workflow.',
                  )
            }
            highlights={
              hasFilters
                ? activeFilterLabels
                : [
                    t('sales.emptyEyebrow', 'Order queue'),
                    t('nav.cta', 'New Order'),
                  ]
            }>
            {hasFilters && (
              <Button asChild variant="outline">
                <Link href="/sales">
                  <RefreshCw className="h-4 w-4" />
                  {t('common.clearFilters', 'Clear filters')}
                </Link>
              </Button>
            )}
            <Button asChild className="brand-glow">
              <Link href="/sales/new">
                <Plus className="h-4 w-4" />
                {t('nav.cta', 'New Order')}
              </Link>
            </Button>
          </EmptyStatePanel>
        ) : (
          sales.map((sale) => {
            const shipping = toShippingMeta(sale.shippingAddress);
            const fulfillmentType =
              sale.fulfillmentMode === 'ON_DEMAND'
                ? 'on-demand'
                : shipping.fulfillmentType ?? 'limited';
            const statusKey = (
              sale.status ||
              (fulfillmentType === 'limited' ? 'packing' : 'awaiting_partner')
            ).toLowerCase();
            const itemCount =
              sale.lines?.reduce(
                (acc: number, line: SaleLine) => acc + (line.quantity ?? 0),
                0,
              ) ?? 0;
            const channelVisual = getChannelVisual(sale.channel);
            const ChannelIcon = channelVisual.icon;
            const executionLabel =
              fulfillmentType === 'on-demand'
                ? shipping.partnerName
                  ? `Partner: ${shipping.partnerName}`
                  : 'Partner fulfillment'
                : 'Stock fulfillment';
            const deliveryLabel =
              shipping.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery';

            return (
              <div
                key={sale.id}
                className={cn(
                  'glass-panel group relative overflow-hidden rounded-[2rem] border border-white/10 p-5 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.07] sm:p-6',
                  selectedSales.has(sale.id) && 'ring-2 ring-primary bg-primary/5',
                )}>
                <div className="absolute inset-y-0 right-0 w-32 bg-[radial-gradient(circle_at_center,rgba(98,195,255,0.08),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="absolute left-4 top-4 z-10 sm:left-5 sm:top-5">
                  <Checkbox
                    checked={selectedSales.has(sale.id)}
                    onCheckedChange={() => toggleSelect(sale.id)}
                    className="h-5 w-5 rounded-md border-white/20 bg-black/40 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                </div>

                <Link
                  href={`/sales/${sale.id}`}
                  className="flex flex-col gap-5 pl-8 sm:pl-10 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div
                      className={cn(
                        'mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border',
                        channelVisual.tone,
                      )}>
                      <ChannelIcon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em]">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-muted-foreground">
                          #{sale.orderNo}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-1',
                            channelVisual.pillTone,
                          )}>
                          <ChannelIcon className="h-3 w-3" />
                          {sale.channel}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-muted-foreground">
                          {deliveryLabel}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                          {sale.customer?.name ??
                            t('saleDetail.unknownIdentity', 'Unknown Customer')}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {executionLabel}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                        <span>{itemCount} {t('sales.items', 'items')}</span>
                        <span>{sale.date.toLocaleDateString()}</span>
                        {shipping.contactNumber && <span>{shipping.contactNumber}</span>}
                      </div>

                      {sale.lines && sale.lines.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          {sale.lines.slice(0, 4).map((line: SaleLine) => {
                            const imageUrl = line.product?.images
                              ? getImgBBThumbnail(line.product.images)
                              : null;

                            return (
                              <div
                                key={line.id}
                                className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5"
                                title={`${line.quantity} x ${line.product?.name ?? 'Product'}`}>
                                {imageUrl ? (
                                  <Image
                                    src={imageUrl}
                                    alt={line.product?.name ?? 'Product'}
                                    width={40}
                                    height={40}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                            );
                          })}
                          {sale.lines.length > 4 && (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-muted-foreground">
                              +{sale.lines.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:min-w-[15rem] lg:flex-col lg:items-end">
                    <div
                      className={cn(
                        'inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]',
                        statusPalette[statusKey] ?? statusPalette.draft,
                      )}>
                      <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                      {t(`statuses.${statusKey}`, statusKey.replace('_', ' '))}
                    </div>

                    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        Order total
                      </p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                        <span className="mr-1 text-sm font-normal text-muted-foreground">
                          {t('common.currency.jod', 'JOD')}
                        </span>
                        {Number(sale.total ?? 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })
        )}
      </div>

      <PaginationControls
        hasNextPage={currentPage < totalPages}
        hasPrevPage={currentPage > 1}
        totalPages={totalPages}
      />
    </div>
  );
}
