'use client';

import { useTranslations } from '@/lib/i18n';
import Link from 'next/link';
import Image from 'next/image';
import { SaleDeleteButton } from '@/components/sales/sale-delete-button';
import { updateSaleStatus, duplicateSale } from '@/app/sales/actions';
import { saleStatuses } from '@/app/sales/statuses';
import type { SaleStatus } from '@/app/sales/statuses';
import { cn } from '@/lib/utils';
import { getImgBBThumbnail } from '@/lib/imgbb';
import { useMemo, useState, useRef } from 'react';
import { Check, Copy, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { ShipmentPrintView } from './shipment-print-view';

type ShippingMeta = {
  contactNumber?: string;
  deliveryMethod?: 'delivery' | 'pickup';
  address?: string;
  pickupLocation?: string;
  deliveryWindow?: string;
  notes?: string;
  deliveryFee?: number;
  channel?: string;
  orderReference?: string;
  fulfillmentType?: string;
  partnerId?: string;
  partnerName?: string;
  city?: string;
};

type SaleDetailClientProps = {
  sale: any; // Using any for now to avoid complex type duplication, ideally should be typed
  fulfillmentType: string;
  partnerLabel?: string | null;
  totalItems: number;
};

// Helper Components
function ShareLinkButton({ saleId, label }: { saleId: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/customer-details/${saleId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="w-full group flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(219,236,10,0.2)]"
    >
      <span>{label}</span>
      {copied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4 text-primary opacity-0 transition-all group-hover:opacity-100" />
      )}
    </button>
  );
}

function PrintLabelButton({ sale, label }: { sale: any; label: string }) {
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  return (
    <>
      <button
        onClick={() => handlePrint()}
        type="button"
        className="w-full group flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(219,236,10,0.2)]"
      >
        <span>{label}</span>
        <Printer className="w-4 h-4 text-primary opacity-0 transition-all group-hover:opacity-100" />
      </button>
      
      {/* Hidden Print Component */}
      <div className="hidden">
        <ShipmentPrintView ref={printRef} sales={[sale]} />
      </div>
    </>
  );
}

function CopyOrderDetailsButton({ sale, label }: { sale: any; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const shipping = sale.shippingAddress || {};
    const customerPhone = shipping.contactNumber || sale.customer?.phone || 'غير متوفر';
    const address = shipping.address || 'غير متوفر';
    
    // Calculate total including shipping fee (same logic as customer-details page)
    const shippingFee = sale.shippingFee || shipping.deliveryFee || 0;
    const actualTotal = (sale.subtotal || 0) - (sale.discounts || 0) + shippingFee;
    
    const message = `[طلب جديد]
الاسم : ${sale.customer?.name || 'غير متوفر'}
رقم الهاتف : ${customerPhone}
العنوان : ${address}
المبلغ شامل التوصيل : ${actualTotal.toFixed(2)} دينار`;

    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="w-full group flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(219,236,10,0.2)]"
    >
      <span>{label}</span>
      {copied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4 text-primary opacity-0 transition-all group-hover:opacity-100" />
      )}
    </button>
  );
}



export function SaleDetailClient({
  sale,
  fulfillmentType,
  partnerLabel,
  totalItems,
}: SaleDetailClientProps) {
  const { t } = useTranslations();
  const shipping = (sale.shippingAddress ?? {}) as ShippingMeta;

  // Helper functions moved inside to use translations
  const formatStatusLabel = (status: string | null, fulfillmentType: string) => {
    const normalized = normalizeStatus(status);
    // We'll use a simplified approach for status labels with translations
    // ideally we'd have keys like `saleDetail.status.draft.limited` etc.
    // For now, I'll map them to the existing structure but use t()
    // This part requires careful mapping.
    // Let's use a switch or object map with t() calls.
    return getStatusLabel(normalized, fulfillmentType, t);
  };

  const events = useMemo(() => buildTimeline(
    fulfillmentType,
    new Date(sale.date),
    sale.status ?? 'DRAFT',
    new Date(sale.updatedAt ?? sale.date),
    t
  ), [fulfillmentType, sale.date, sale.status, sale.updatedAt, t]);

  return (
    <div className="space-y-6 px-4 pb-24 pt-6 sm:px-6 lg:px-10">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <Link href="/sales" className="hover:text-foreground transition-colors">
              {t('saleDetail.header.tradingFloor', 'Trading Floor')}
            </Link>
            <span className="text-white/20">/</span>
            <span className="font-mono text-primary">ORD-{sale.orderNo}</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-4xl">
            {sale.customer?.name ?? t('saleDetail.header.unknownIdentity', 'Unknown Identity')}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground backdrop-blur-md">
              {sale.channel ?? 'Direct'}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(sale.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 md:flex-col md:items-end md:justify-start md:border-none md:bg-transparent md:p-0">
          <div className="md:text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {t('saleDetail.header.totalValue', 'Total Value')}
            </p>
            <p className="text-holographic text-2xl font-bold sm:text-4xl">
              {t('common.currency', 'JOD')} {Number(sale.total ?? 0).toFixed(2)}
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground sm:text-xs">
            <span>{totalItems} {t('saleDetail.header.units', 'units')}</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span className="uppercase">{fulfillmentType}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* Timeline Blueprint */}
          <div className="glass-panel relative overflow-hidden rounded-[1.5rem] p-5 sm:rounded-[2rem] sm:p-8">
            <div className="absolute right-0 top-0 p-6 opacity-10">
              <div className="h-32 w-32 rounded-full border-[16px] border-primary" />
            </div>
            <p className="mb-6 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {t('saleDetail.trajectory.title', 'Order Trajectory')}
            </p>
            <ul className="relative ml-1 space-y-8 border-l border-white/10 pl-6 sm:ml-2 sm:pl-8">
              {events.map((event, index) => (
                <li key={`${event.label}-${event.state}`} className="relative">
                  <span
                    className={cn(
                      'absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 transition-all duration-500 sm:-left-[37px] sm:h-4 sm:w-4',
                      event.state === 'done'
                        ? 'border-emerald-500 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                        : event.state === 'current'
                        ? 'animate-pulse border-primary bg-primary shadow-[0_0_20px_rgba(219,236,10,0.6)]'
                        : 'border-white/10 bg-background'
                    )}
                  />
                  <div className={cn("transition-all duration-300", event.state === 'pending' && "opacity-50")}>
                    <p className={cn(
                      "text-sm font-bold",
                      event.state === 'current' ? "text-primary" : "text-foreground"
                    )}>
                      {event.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.meta}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Manifest Blueprint */}
          <div className="glass-panel rounded-[1.5rem] p-5 sm:rounded-[2rem] sm:p-6">
            <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {t('saleDetail.manifest.title', 'Manifest')}
              </p>
              <Link
                href="/sales/new"
                className="text-xs font-medium text-primary hover:text-primary/80 hover:underline"
              >
                {t('saleDetail.manifest.duplicateOrder', 'Duplicate Order')}
              </Link>
            </div>
            
            <div className="space-y-3">
              {sale.lines?.map((line: any) => {
                const productImageUrl = line.product?.images
                  ? getImgBBThumbnail(line.product.images)
                  : null;
                return (
                  <div
                    key={line.id}
                    className="group flex flex-col gap-3 rounded-xl border border-white/5 bg-white/5 p-3 transition-all hover:border-white/10 hover:bg-white/10 sm:flex-row sm:items-center sm:px-4 sm:py-3"
                  >
                    <div className="flex items-center gap-3">
                      {productImageUrl ? (
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/20">
                          <Image
                            src={productImageUrl}
                            alt={line.product?.name ?? 'Product'}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="48px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-lg">
                          📦
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0 sm:hidden">
                        <p className="font-medium text-foreground truncate text-sm">
                          {line.product?.name ?? t('saleDetail.manifest.unknownItem', 'Unknown Item')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-mono text-foreground">{line.quantity}</span> × {t('common.currency', 'JOD')} {Number(line.unitPrice ?? 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="hidden sm:block sm:flex-1 sm:min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {line.product?.name ?? t('saleDetail.manifest.unknownItem', 'Unknown Item')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono text-foreground">{line.quantity}</span> {t('saleDetail.manifest.units', 'units')} × {t('common.currency', 'JOD')} {Number(line.unitPrice ?? 0).toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-white/5 pt-2 sm:border-none sm:pt-0 sm:block sm:text-right">
                      <span className="text-xs text-muted-foreground sm:hidden">{t('saleDetail.manifest.total', 'Total')}</span>
                      <p className="font-mono text-sm font-bold text-foreground">
                        {t('common.currency', 'JOD')} {Number(line.lineTotal ?? line.unitPrice ?? 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Logistics Data */}
          <div className="glass-panel rounded-[1.5rem] p-5 sm:rounded-[2rem] sm:p-6">
            <p className="mb-6 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {t('saleDetail.logistics.title', 'Logistics Data')}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <InfoTile label={t('saleDetail.logistics.contactSignal', 'Contact Signal')} value={shipping.contactNumber ?? '—'} />
              <InfoTile
                label={t('saleDetail.logistics.vector', 'Vector')}
                value={
                  shipping.deliveryMethod === 'pickup'
                    ? `${t('saleDetail.logistics.pickup', 'Pickup')} · ${shipping.pickupLocation ?? 'Studio'}`
                    : `${t('saleDetail.logistics.delivery', 'Delivery')} · ${shipping.address ?? 'Pending'}`
                }
              />
              <InfoTile
                label={t('saleDetail.logistics.fee', 'Logistics Fee')}
                value={
                  shipping.deliveryMethod === 'delivery'
                    ? `${t('common.currency', 'JOD')} ${(shipping.deliveryFee ?? 0).toFixed(2)}`
                    : t('saleDetail.logistics.waived', 'Waived')
                }
              />
              <InfoTile
                label={t('saleDetail.logistics.node', 'Fulfillment Node')}
                value={
                  fulfillmentType === 'on-demand'
                    ? shipping.partnerId ?? 'Unassigned'
                    : t('saleDetail.logistics.internalStock', 'Internal Stock')
                }
              />
            </div>
            {shipping.notes && (
              <div className="mt-4 rounded-xl border border-dashed border-yellow-500/20 bg-yellow-500/5 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase text-yellow-500">{t('saleDetail.logistics.fieldNotes', 'Field Notes')}</p>
                <p className="text-sm text-muted-foreground">{shipping.notes}</p>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          {/* Quick Actions */}
          <div className="glass-panel rounded-[1.5rem] p-5 sm:rounded-[2rem] sm:p-6">
            <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {t('saleDetail.actions.command', 'Command')}
            </p>
            <div className="space-y-3">
              <ShareLinkButton saleId={sale.id} label={t('saleDetail.actions.shareLink', 'Share Customer Link')} />
              <PrintLabelButton sale={sale} label={t('saleDetail.actions.printLabel', 'Print Label')} />
              <CopyOrderDetailsButton sale={sale} label={t('saleDetail.actions.copyDetails', 'Copy Order Details')} />
              <LinkButton href={`/sales/${sale.id}/edit`} label={t('saleDetail.actions.editOrder', 'Edit Order')} />
              <LinkButton href={`/returns/new?saleId=${sale.id}`} label={t('saleDetail.actions.issueReturn', 'Issue Return')} />
              <LinkButton href={`/expenses/new?saleId=${sale.id}`} label={t('saleDetail.actions.logExpense', 'Log Expense')} />
              <RepeatOrderButton saleId={sale.id} label={t('saleDetail.actions.repeatOrder', 'Repeat order')} />
              <SaleDeleteButton
                saleId={sale.id}
                variant="destructive"
                size="default"
                redirectToList
                label={t('saleDetail.actions.deleteOrder', 'Delete Order')}
              />
            </div>
          </div>

          {/* Status Control */}
          <div className="glass-panel rounded-[1.5rem] p-5 sm:rounded-[2rem] sm:p-6">
            <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {t('saleDetail.status.override', 'Status Override')}
            </p>
            <form action={updateSaleStatus} className="space-y-3">
              <input type="hidden" name="saleId" value={sale.id} />
              <select
                name="status"
                defaultValue={sale.status ?? 'DRAFT'}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground backdrop-blur-md transition-colors focus:border-primary/50 focus:bg-white/10"
              >
                {saleStatuses.map((status) => (
                  <option key={status} value={status} className="bg-zinc-900 text-foreground">
                    {formatStatusLabel(status, fulfillmentType)}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-[0_0_20px_rgba(219,236,10,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(219,236,10,0.5)]"
              >
                {t('saleDetail.status.updateButton', 'Update Status')}
              </button>
            </form>
          </div>

          {/* Partner Card */}
          {fulfillmentType === 'on-demand' && (sale.partner || partnerLabel) && (
            <div className="glass-panel rounded-[1.5rem] p-5 sm:rounded-[2rem] sm:p-6">
              <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {t('saleDetail.partner.link', 'Partner Link')}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-accent">
                  🤝
                </div>
                <div>
                  <p className="font-bold text-foreground">{partnerLabel}</p>
                  <p className="text-xs text-muted-foreground">{t('saleDetail.partner.authorizedAgent', 'Authorized Agent')}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 border-t border-white/5 pt-4 text-sm text-muted-foreground">
                {sale.partner?.contactName && (
                  <div className="flex justify-between">
                    <span>{t('saleDetail.partner.contact', 'Contact')}</span>
                    <span className="text-foreground">{sale.partner.contactName}</span>
                  </div>
                )}
                {sale.partner?.contactPhone && (
                  <div className="flex justify-between">
                    <span>{t('saleDetail.partner.phone', 'Phone')}</span>
                    <span className="text-foreground">{sale.partner.contactPhone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Money Trail */}
          <div className="glass-panel rounded-[1.5rem] p-5 sm:rounded-[2rem] sm:p-6">
            <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {t('saleDetail.ledger.title', 'Ledger')}
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{t('saleDetail.ledger.subtotal', 'Subtotal')}</span>
                <span className="font-mono">{t('common.currency', 'JOD')} {Number(sale.subtotal ?? 0).toFixed(2)}</span>
              </div>
              {shipping.deliveryMethod === 'delivery' && typeof shipping.deliveryFee === 'number' && (
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('saleDetail.ledger.logistics', 'Logistics')}</span>
                  <span className="font-mono">{t('common.currency', 'JOD')} {shipping.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              {sale.orderExpenses && sale.orderExpenses.length > 0 && (
                <div className="space-y-1">
                  {sale.orderExpenses.map((expense: any) => (
                    <div key={expense.id} className="flex justify-between text-muted-foreground text-xs">
                      <span>{expense.category.charAt(0) + expense.category.slice(1).toLowerCase().replace('_', ' ')}</span>
                      <span className="font-mono">{t('common.currency', 'JOD')} {Number(expense.amount ?? 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Cost Display */}
              <div className="flex justify-between text-muted-foreground border-t border-white/5 pt-3">
                <span className="flex items-center gap-1.5">
                  {t('saleDetail.ledger.cost', 'Cost')}
                  {(sale.customCostOverride !== null && sale.customCostOverride !== undefined) && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Override
                    </span>
                  )}
                </span>
                <span className="font-mono text-rose-400">
                  -{t('common.currency', 'JOD')} {(() => {
                    if (sale.customCostOverride !== null && sale.customCostOverride !== undefined) {
                      return Number(sale.customCostOverride).toFixed(2);
                    }
                    const lineCost = sale.lines?.reduce((sum: number, line: any) => sum + Number(line.cogs ?? 0), 0) ?? 0;
                    if (lineCost > 0) return lineCost.toFixed(2);
                    const revenue = Number(sale.subtotal ?? 0);
                    return (revenue * (fulfillmentType === 'limited' ? 0.55 : 0.65)).toFixed(2);
                  })()}
                </span>
              </div>

              {/* Profit Display */}
              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  {t('saleDetail.ledger.profit', 'Profit')}
                  {(sale.customProfitOverride !== null && sale.customProfitOverride !== undefined) && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Override
                    </span>
                  )}
                </span>
                <span className="font-mono text-emerald-400">
                  +{t('common.currency', 'JOD')} {(() => {
                    if (sale.customProfitOverride !== null && sale.customProfitOverride !== undefined) {
                      return Number(sale.customProfitOverride).toFixed(2);
                    }
                    const revenue = Number(sale.subtotal ?? 0);
                    let cost: number;
                    if (sale.customCostOverride !== null && sale.customCostOverride !== undefined) {
                      cost = Number(sale.customCostOverride);
                    } else {
                      const lineCost = sale.lines?.reduce((sum: number, line: any) => sum + Number(line.cogs ?? 0), 0) ?? 0;
                      cost = lineCost > 0 ? lineCost : revenue * (fulfillmentType === 'limited' ? 0.55 : 0.65);
                    }
                    return (revenue - cost).toFixed(2);
                  })()}
                </span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>{t('saleDetail.ledger.estMargin', 'Est. Margin')}</span>
                <span className="font-mono text-emerald-400">
                  {estimateMargin(sale, fulfillmentType)?.toFixed(1)}%
                </span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between text-base font-bold text-foreground">
                <span>{t('saleDetail.ledger.total', 'Total')}</span>
                <span className="font-mono text-holographic">{t('common.currency', 'JOD')} {Number(sale.total ?? 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// --- Helper Components & Functions ---

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/5 px-4 py-3 transition-all hover:border-primary/30 hover:bg-white/10">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm font-semibold text-foreground">{value}</p>
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(219,236,10,0.2)]">
      <span>{label}</span>
      <span className="text-primary opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100">→</span>
    </Link>
  );
}

function RepeatOrderButton({ saleId, label }: { saleId: string, label: string }) {
  // Note: duplicateSale is a server action. 
  // In a client component, we can call it in an onClick handler.
  // However, the original was a link to the result of the action? 
  // No, the original was an async component that awaited the action.
  // Wait, `const duplicateUrl = await duplicateSale(saleId);` in the original code implies it pre-calculates the URL?
  // That seems odd for a button unless it's just a link.
  // If `duplicateSale` creates a new draft and returns the URL, then we should probably make this a button that calls the action on click.
  // But to keep it simple and match the original behavior (which seemed to be a server component rendering a link),
  // we might need to change how this works or pass the URL from the server.
  // Let's assume for now we can't await it in render.
  // I'll make it a button that triggers the action.
  
  const handleClick = async () => {
     const url = await duplicateSale(saleId);
     window.location.href = url;
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className="w-full group flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(219,236,10,0.2)]">
      <span>{label}</span>
      <span className="text-primary opacity-0 transition-all group-hover:rotate-180 group-hover:opacity-100">↻</span>
    </button>
  );
}

function estimateMargin(sale: any, fulfillmentType: string) {
  const revenue =
    sale.lines?.reduce((sum: number, line: any) => {
      const fallback = Number(line.unitPrice ?? 0) * Number(line.quantity ?? 0);
      return sum + Number(line.lineTotal ?? fallback);
    }, 0) ?? Number(sale.subtotal ?? 0);

  if (revenue === 0) return 0;

  // Use custom cost override if available, otherwise calculate from line items
  let cost: number;
  if (sale.customCostOverride !== null && sale.customCostOverride !== undefined) {
    cost = Number(sale.customCostOverride);
  } else {
    cost =
      sale.lines?.reduce((sum: number, line: any) => sum + Number(line.cogs ?? 0), 0) ??
      revenue * (fulfillmentType === 'limited' ? 0.55 : 0.65);
  }

  // If custom profit override is set, use it directly
  if (sale.customProfitOverride !== null && sale.customProfitOverride !== undefined) {
    const profit = Number(sale.customProfitOverride);
    return (profit / revenue) * 100;
  }

  return ((revenue - cost) / revenue) * 100;
}

function normalizeStatus(status: string | null): SaleStatus {
  if (!status) return 'DRAFT';
  const upper = status.toUpperCase();
  return (saleStatuses.find((step) => step === upper) ?? 'DRAFT') as SaleStatus;
}

// Timeline Logic
type TimelineState = 'done' | 'current' | 'pending';

const LIMITED_FLOW: SaleStatus[] = [
  'DRAFT',
  'AWAITING_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];
const ON_DEMAND_FLOW: SaleStatus[] = [
  'DRAFT',
  'AWAITING_SUPPLIER',
  'SUPPLIER_CONFIRMED',
  'AWAITING_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

function getStatusLabel(status: SaleStatus, fulfillmentType: string, t: any) {
    // This mapping needs to be comprehensive based on translations.ts
    // For now I'll use a simplified mapping or fallback to English if keys are missing
    // But I should try to use the keys I added.
    // I added keys like `saleDetail.timeline.draft.limitedLabel` etc.
    
    const keyBase = `saleDetail.timeline.${status.toLowerCase()}`;
    const typeKey = fulfillmentType === 'on-demand' ? 'onDemandLabel' : 'limitedLabel';
    
    // Fallback English labels from original file
    const defaults: any = {
        DRAFT: { limited: 'Order captured', onDemand: 'Order captured' },
        AWAITING_SUPPLIER: { limited: 'Awaiting supplier', onDemand: 'Awaiting supplier' },
        SUPPLIER_CONFIRMED: { limited: 'Supplier confirmed', onDemand: 'Partner confirmed' },
        AWAITING_DELIVERY: { limited: 'Awaiting delivery slot', onDemand: 'Awaiting delivery slot' },
        OUT_FOR_DELIVERY: { limited: 'Out for delivery', onDemand: 'Out for delivery' },
        DELIVERED: { limited: 'Delivered', onDemand: 'Delivered' },
        CANCELED: { limited: 'Canceled', onDemand: 'Canceled' },
        RETURNED: { limited: 'Returned', onDemand: 'Returned' },
    };

    const defaultLabel = defaults[status]?.[fulfillmentType === 'on-demand' ? 'onDemand' : 'limited'] ?? status;
    
    return t(`${keyBase}.${typeKey}`, defaultLabel);
}

function buildTimeline(
  fulfillment: string,
  date: Date,
  status: string | null,
  updatedAt: Date,
  t: any
): Array<{ label: string; meta: string; state: TimelineState }> {
  const normalized = normalizeStatus(status);
  const baseFlow = fulfillment === 'on-demand' ? ON_DEMAND_FLOW : LIMITED_FLOW;
  const flow =
    (normalized === 'CANCELED' || normalized === 'RETURNED') &&
    !baseFlow.includes(normalized)
      ? [...baseFlow, normalized]
      : baseFlow;
  const indexOfStatus = flow.findIndex((step) => step === normalized);
  const currentIndex = indexOfStatus === -1 ? 0 : indexOfStatus;
  const isTerminal =
    normalized === 'DELIVERED' ||
    normalized === 'CANCELED' ||
    normalized === 'RETURNED';

  return flow.map((step, index) => {
    const keyBase = `saleDetail.timeline.${step.toLowerCase()}`;
    const typeLabelKey = fulfillment === 'on-demand' ? 'onDemandLabel' : 'limitedLabel';
    const typeMetaKey = fulfillment === 'on-demand' ? 'onDemandMeta' : 'limitedMeta';
    
    // Fallbacks
    const defaults: any = {
        DRAFT: { 
            limitedLabel: 'Order captured', limitedMeta: 'Logged in dashboard',
            onDemandLabel: 'Order captured', onDemandMeta: 'Logged and routed to partner desk'
        },
        // ... (other defaults could be added here but relying on t() mainly)
    };
    
    const label = t(`${keyBase}.${typeLabelKey}`, defaults[step]?.[typeLabelKey] ?? step);
    const baseMeta = t(`${keyBase}.${typeMetaKey}`, defaults[step]?.[typeMetaKey] ?? '');

    const state: TimelineState =
      index < currentIndex
        ? 'done'
        : index === currentIndex
        ? isTerminal
          ? 'done'
          : 'current'
        : 'pending';

    let meta: string;
    if (state === 'done') {
      meta = `${t('saleDetail.timeline.completed', 'Completed')} • ${formatTimelineTimestamp(addHours(date, index))}`;
    } else if (state === 'current') {
      meta = `${baseMeta} • ${t('saleDetail.timeline.updated', 'Updated')} ${formatRelativeTimestamp(updatedAt)}`;
    } else {
      meta = `${t('saleDetail.timeline.pending', 'Pending')} • ${baseMeta}`;
    }

    return { label, meta, state };
  });
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function formatTimelineTimestamp(date: Date) {
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTimestamp(date: Date) {
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'just now';
  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes}m ago`;
  }
  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours}h ago`;
  }
  const days = Math.floor(diff / day);
  return `${days}d ago`;
}
