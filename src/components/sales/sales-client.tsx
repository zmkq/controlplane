'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';
import { BentoGrid, BentoCard } from '@/components/dashboard/bento-grid';
import { RevenueCard, LiveRadarCard } from '@/components/dashboard/holographic-kpi';
import { Plus, Filter, Package, Search, Printer, X, RefreshCw, ChevronDown } from 'lucide-react';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { SearchInput } from '@/components/ui/search-input';
import { getImgBBThumbnail } from '@/lib/imgbb';
import { useReactToPrint } from 'react-to-print';
import { ShipmentPrintView } from './shipment-print-view';
import { useRef, useState, useTransition } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { bulkUpdateSaleStatus } from '@/app/sales/actions';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/lib/toast';

type ShippingMeta = {
  deliveryMethod?: 'delivery' | 'pickup';
  address?: string;
  contactNumber?: string;
  deliveryFee?: number;
  fulfillmentType?: 'limited' | 'on-demand';
  partnerName?: string;
};

type SalesClientProps = {
  sales: any[];
  totalCount: number;
  revenueThisWeek: number;
  pendingCount: number;
  latestChannel: string;
  currentPage: number;
  totalPages: number;
  channelFilter: string;
  fulfillmentFilter: string;
  searchQuery: string;
};

const statusPalette: Record<string, string> = {
  delivered: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_10px_rgba(52,211,153,0.2)]',
  awaiting_delivery: 'text-primary border-primary/40 bg-primary/10 shadow-[0_0_10px_rgba(219,236,10,0.2)]',
  awaiting_supplier: 'text-cyan-300 border-cyan-400/30 bg-cyan-400/10',
  supplier_confirmed: 'text-cyan-300 border-cyan-400/30 bg-cyan-400/10',
  out_for_delivery: 'text-primary border-primary/40 bg-primary/10',
  draft: 'text-muted-foreground border-white/10 bg-white/5',
  canceled: 'text-destructive border-destructive/40 bg-destructive/10',
  returned: 'text-destructive border-destructive/40 bg-destructive/10',
};

export function SalesClient({
  sales,
  totalCount,
  revenueThisWeek,
  pendingCount,
  latestChannel,
  currentPage,
  totalPages,
  channelFilter,
  fulfillmentFilter,
  searchQuery,
}: SalesClientProps) {
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
    const newSelected = new Set(selectedSales);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSales(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedSales.size === sales.length) {
      setSelectedSales(new Set());
    } else {
      setSelectedSales(new Set(sales.map(s => s.id)));
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    startTransition(async () => {
      try {
        const result = await bulkUpdateSaleStatus({
          ids: Array.from(selectedSales),
          status: status as any,
        });

        if (result.updatedCount === 0) {
          toast.info('No order statuses changed', {
            description: `${result.skippedCount} selected order${result.skippedCount === 1 ? '' : 's'} already matched that status.`,
          });
          setShowStatusDropdown(false);
          return;
        }

        setSelectedSales(new Set());
        setShowStatusDropdown(false);
        router.refresh();
        toast.success('Order statuses updated', {
          description: `${result.updatedCount} order${result.updatedCount === 1 ? '' : 's'} moved to ${statusOptions.find((option) => option.value === status)?.label ?? status}.`,
        });
      } catch (error) {
        console.error('Failed to update status:', error);
        toast.error('Failed to update order status');
      }
    });
  };

  const selectedSalesData = sales.filter(s => selectedSales.has(s.id));

  const statusOptions = [
    { value: 'AWAITING_DELIVERY', label: 'Awaiting Delivery', color: 'text-primary' },
    { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: 'text-primary' },
    { value: 'DELIVERED', label: 'Delivered', color: 'text-emerald-400' },
    { value: 'SUPPLIER_CONFIRMED', label: 'Partner Confirmed', color: 'text-cyan-300' },
    { value: 'CANCELED', label: 'Canceled', color: 'text-destructive' },
    { value: 'RETURNED', label: 'Returned', color: 'text-destructive' },
  ];

  const channelFilters = [
    { value: 'all', label: t('sales.filters.channels.all', 'All Channels') },
    { value: 'instagram', label: t('sales.filters.channels.instagram', 'Instagram') },
    { value: 'whatsapp', label: t('sales.filters.channels.whatsapp', 'WhatsApp') },
    { value: 'facebook', label: t('sales.filters.channels.facebook', 'Facebook') },
    { value: 'offline', label: t('sales.filters.channels.offline', 'Offline') },
  ];

  const fulfillmentFilters = [
    { value: 'all', label: t('sales.filters.fulfillment.all', 'All Types') },
    { value: 'limited', label: t('sales.filters.fulfillment.limited', 'Limited Stock') },
    { value: 'on-demand', label: t('sales.filters.fulfillment.onDemand', 'On-Demand') },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-8 px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
            {t('saleDetail.tradingFloor', 'Trading Floor')}
          </p>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            <span className="text-foreground">{t('sidebar.nav.sales', 'Sales')}</span>{' '}
            <span className="text-premium-gradient">{t('saleDetail.ledger.title', 'Ledger')}</span>
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground/80">
            {t('sales.heroSubtitle', 'Real-time order tracking and fulfillment management.')}
          </p>
        </div>
        <Link
          href="/sales/new"
          className="group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-8 font-bold text-primary-foreground transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(219,236,10,0.4)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <Plus className="h-5 w-5" />
          {t('nav.cta', 'New Order')}
        </Link>
      </div>

      {/* Metrics Grid */}
      <BentoGrid className="md:grid-cols-3">
        <BentoCard>
          <RevenueCard
            label={t('sales.metrics.revenue', 'Weekly Revenue')}
            value={`JOD ${revenueThisWeek.toLocaleString()}`}
            trend="+12%" // Placeholder
          />
        </BentoCard>
        <BentoCard>
          <LiveRadarCard
            label={t('sales.metrics.active', 'Active Orders')}
            value={pendingCount}
          />
        </BentoCard>
        <BentoCard>
          <div className="flex h-full flex-col justify-between">
             <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
               {t('sales.metrics.latestChannel', 'Latest Channel')}
             </span>
             <div className="flex items-center gap-3">
               <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-2xl">
                 {latestChannel === 'instagram' ? '📸' : latestChannel === 'whatsapp' ? '💬' : '🌐'}
               </div>
               <p className="text-2xl font-bold capitalize text-foreground">{latestChannel}</p>
             </div>
          </div>
        </BentoCard>
      </BentoGrid>

      {/* Hidden Print Component */}
      <div className="hidden">
        <ShipmentPrintView ref={printRef} sales={selectedSalesData} />
      </div>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedSales.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-2xl md:bottom-8 md:left-1/2 md:right-auto md:-translate-x-1/2"
          >
            <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/90 p-3 backdrop-blur-xl shadow-[0_0_40px_rgba(219,236,10,0.15)] md:flex-row md:items-center md:gap-3 md:px-5">
              {/* Selection Count */}
              <div className="flex items-center justify-between md:justify-start md:gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {selectedSales.size}
                  </div>
                  <span className="text-sm font-medium text-white">
                    {selectedSales.size === 1 ? 'order' : 'orders'} selected
                  </span>
                </div>

                {/* Close button (mobile only) */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSales(new Set())}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-white md:hidden"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="hidden h-6 w-px bg-white/20 md:block" />

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Status Update Dropdown */}
                <div className="relative flex-1 md:flex-none">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    disabled={isPending}
                    className="h-9 w-full gap-2 text-white hover:bg-white/10 hover:text-primary md:w-auto"
                  >
                    <RefreshCw className={cn('h-4 w-4', isPending && 'animate-spin')} />
                    <span className="hidden sm:inline">Update Status</span>
                    <span className="sm:hidden">Status</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>

                  <AnimatePresence>
                    {showStatusDropdown && (
                      <>
                        {/* Backdrop */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setShowStatusDropdown(false)}
                          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
                        />
                        
                        {/* Dropdown */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-xl border border-white/10 bg-black/95 backdrop-blur-xl shadow-2xl md:left-0 md:right-auto md:w-56"
                        >
                          {statusOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleBulkStatusUpdate(option.value)}
                              disabled={isPending}
                              className={cn(
                                'w-full px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-white/10',
                                option.color,
                                'disabled:opacity-50'
                              )}
                            >
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
                  className="h-9 flex-1 gap-2 bg-white text-black hover:bg-white/90 md:flex-none"
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">Print Labels</span>
                  <span className="sm:hidden">Print</span>
                </Button>
              </div>

              {/* Close button (desktop only) */}
              <div className="hidden h-6 w-px bg-white/20 md:block" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSales(new Set())}
                className="hidden h-8 w-8 p-0 text-muted-foreground hover:text-white md:block"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Search */}
      <div className="sticky top-[calc(var(--nav-height)+1rem)] z-30 space-y-4 rounded-3xl border border-white/5 bg-background/80 p-4 backdrop-blur-xl transition-all">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput placeholder={t('common.buttons.search', 'Search...')} />
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
             <Filter className="h-4 w-4 text-muted-foreground mr-2" />
             {channelFilters.map((filter) => (
                <Link
                  key={filter.value}
                  href={`/sales?channel=${filter.value}&fulfillment=${fulfillmentFilter}&q=${searchQuery}`}
                  className={cn(
                    'whitespace-nowrap rounded-xl border px-4 py-2 text-xs font-medium transition-all hover:scale-105',
                    channelFilter === filter.value
                      ? 'glass-active text-primary border-primary/30 shadow-[0_0_15px_rgba(219,236,10,0.1)]'
                      : 'border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                  )}
                >
                  {filter.label}
                </Link>
             ))}
             <div className="h-6 w-px bg-white/10 mx-2" />
             {fulfillmentFilters.map((filter) => (
                <Link
                  key={filter.value}
                  href={`/sales?channel=${channelFilter}&fulfillment=${filter.value}&q=${searchQuery}`}
                  className={cn(
                    'whitespace-nowrap rounded-xl border px-4 py-2 text-xs font-medium transition-all hover:scale-105',
                    fulfillmentFilter === filter.value
                      ? 'glass-active text-accent border-accent/30 shadow-[0_0_15px_rgba(98,195,255,0.1)]'
                      : 'border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                  )}
                >
                  {filter.label}
                </Link>
             ))}
          </div>
          
          {/* Select All Checkbox */}
          <div className="flex items-center gap-2 px-2">
             <Checkbox 
                checked={sales.length > 0 && selectedSales.size === sales.length}
                onCheckedChange={toggleSelectAll}
                className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
             />
             <span className="text-xs text-muted-foreground">Select All</span>
          </div>
        </div>
      </div>

      {/* Sales List (Trading Floor Ticker Style) */}
      <div className="grid gap-4">
        {sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/10 bg-white/5 py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4">
               <Search className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{t('sales.empty', 'No orders found')}</h3>
            <p className="text-sm text-muted-foreground">{t('sales.emptyHint', 'Try adjusting your filters or search query.')}</p>
          </div>
        ) : (
          sales.map((sale) => {
            const shipping = (sale.shippingAddress ?? {}) as ShippingMeta;
            const fulfillmentType = sale.fulfillmentMode === 'ON_DEMAND' ? 'on-demand' : shipping.fulfillmentType ?? 'limited';
            const statusKey = (sale.status || (fulfillmentType === 'limited' ? 'packing' : 'awaiting_partner')).toLowerCase();
            const itemCount = sale.lines?.reduce((acc: number, line: any) => acc + (line.quantity ?? 0), 0) ?? 0;

            return (
              <div
                key={sale.id}
                className={cn(
                  "glass-panel group relative flex flex-col gap-4 rounded-[2rem] p-5 transition-all hover:-translate-y-1 hover:bg-white/[0.07] sm:flex-row sm:items-center sm:justify-between",
                  selectedSales.has(sale.id) && "ring-2 ring-primary bg-primary/5"
                )}
              >
                {/* Selection Checkbox */}
                <div className="absolute left-4 top-4 z-10 sm:relative sm:left-auto sm:top-auto sm:mr-2">
                  <Checkbox 
                    checked={selectedSales.has(sale.id)}
                    onCheckedChange={() => toggleSelect(sale.id)}
                    className="h-5 w-5 rounded-md border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                </div>

                <Link href={`/sales/${sale.id}`} className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: ID & Customer */}
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-xl font-bold transition-colors",
                    statusPalette[statusKey]?.includes('emerald') ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
                    statusPalette[statusKey]?.includes('primary') ? 'border-primary/30 bg-primary/10 text-primary' :
                    'border-white/10 bg-white/5 text-muted-foreground'
                  )}>
                    {sale.customer?.name?.charAt(0).toUpperCase() ?? '#'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
                      <span>#{sale.orderNo}</span>
                      <span className="h-1 w-1 rounded-full bg-white/20" />
                      <span>{sale.channel}</span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {sale.customer?.name ?? t('saleDetail.unknownIdentity', 'Unknown Customer')}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                       <span>{itemCount} {t('sales.items', 'items')}</span>
                       <span className="h-1 w-1 rounded-full bg-white/20" />
                       <span>{sale.date.toLocaleDateString()}</span>
                    </div>
                    
                    {/* Product Preview with Images */}
                    {sale.lines && sale.lines.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5">
                        {sale.lines.slice(0, 3).map((line: any) => {
                          const imageUrl = line.product?.images ? getImgBBThumbnail(line.product.images) : null;
                          return (
                            <div
                              key={line.id}
                              className="group relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5 transition-all hover:scale-110 hover:border-primary/30"
                              title={`${line.quantity}× ${line.product?.name ?? 'Product'}`}
                            >
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  alt={line.product?.name ?? 'Product'}
                                  width={40}
                                  height={40}
                                  className="object-cover"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          );
                        })}
                        {sale.lines.length > 3 && (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-muted-foreground">
                            +{sale.lines.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Status & Value */}
                <div className="flex items-center justify-between gap-6 sm:justify-end">
                  <div className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                    statusPalette[statusKey] ?? statusPalette.draft
                  )}>
                    <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                    {t(`statuses.${statusKey}`, statusKey.replace('_', ' '))}
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground tabular-nums">
                      <span className="text-sm font-normal text-muted-foreground mr-1">{t('common.currency.jod', 'JOD')}</span>
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

      {/* Pagination Controls */}
      <PaginationControls
        hasNextPage={currentPage < totalPages}
        hasPrevPage={currentPage > 1}
        totalPages={totalPages}
      />
    </div>
  );
}
