'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AlertTriangle, Edit, Package, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getImgBBThumbnail } from '@/lib/imgbb';

type ProductCardProps = {
  id: string;
  brand: string;
  name: string;
  sku: string;
  flavor: string | null;
  size: string | null;
  quantity: number;
  cost: number;
  active: boolean;
  fulfillmentMode: 'limited' | 'on-demand';
  imageUrl: string | null;
  lowStock: boolean;
  currencyFormatter: Intl.NumberFormat;
  onEdit: () => void;
  onDelete: () => void;
};

function ProductImagePlaceholder({
  name,
  brand,
}: {
  name: string;
  brand: string;
}) {
  const initial = name.charAt(0).toUpperCase();
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/90"
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 70%, 45%), hsl(${
          (hue + 60) % 360
        }, 70%, 35%))`,
      }}>
      <div className="text-4xl font-bold">{initial}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
        {brand}
      </div>
      <Package className="h-6 w-6 opacity-50" />
    </div>
  );
}

export function ProductCard({
  brand,
  name,
  sku,
  flavor,
  size,
  quantity,
  cost,
  active,
  fulfillmentMode,
  imageUrl,
  lowStock,
  currencyFormatter,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const thumbnailUrl = imageUrl ? getImgBBThumbnail(imageUrl) : null;
  const stockLabel = fulfillmentMode === 'on-demand' ? 'By request' : `${quantity}`;
  const modeLabel =
    fulfillmentMode === 'on-demand' ? 'On-demand partner' : 'Limited batch';

  return (
    <div
      className={cn(
        'glass-panel group relative overflow-hidden rounded-[1.75rem] border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_18px_45px_rgba(0,0,0,0.35)]',
        !active && 'opacity-70 saturate-75',
      )}>
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(219,236,10,0.12),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-white/10 bg-muted/30">
        {thumbnailUrl && !imageError ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 animate-pulse bg-muted/50" />
            )}
            <Image
              src={thumbnailUrl}
              alt={`${name} - ${brand}`}
              fill
              className={cn(
                'object-cover transition-all duration-500 group-hover:scale-105',
                imageLoading ? 'opacity-0' : 'opacity-100',
              )}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            />
          </>
        ) : (
          <ProductImagePlaceholder name={name} brand={brand} />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          {!active && (
            <span className="inline-flex items-center rounded-full border border-white/20 bg-black/60 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/80">
              Inactive
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em]',
              fulfillmentMode === 'on-demand'
                ? 'border border-cyan-500/30 bg-cyan-500/20 text-cyan-300'
                : 'border border-primary/30 bg-primary/20 text-primary',
            )}>
            {modeLabel}
          </span>
        </div>

        {lowStock && fulfillmentMode === 'limited' && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white">
            <AlertTriangle className="h-3 w-3" />
            Low Stock
          </div>
        )}
      </div>

      <div className="space-y-4 p-4">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {brand}
          </p>
          <h3 className="min-h-[3rem] text-base font-semibold leading-tight text-foreground line-clamp-2">
            {name}
          </h3>
          <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
              {size || 'Core SKU'}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono">
              {sku}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-3">
          <StatPill
            label="Stock"
            value={stockLabel}
            valueClassName={cn(
              lowStock && fulfillmentMode === 'limited'
                ? 'text-destructive'
                : 'text-foreground',
            )}
          />
          <StatPill label="Unit Cost" value={currencyFormatter.format(cost)} />
          <StatPill
            label="Mode"
            value={modeLabel}
            className="col-span-2 sm:col-span-1"
          />
          {flavor && (
            <StatPill
              label="Flavor"
              value={flavor}
              className="col-span-2 sm:col-span-3"
            />
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="h-9 flex-1 border-white/10 bg-white/5 text-[11px] hover:border-primary/50 hover:bg-primary/5">
            <Edit className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-9 w-9 rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete product">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  className,
  valueClassName,
}: {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-[1rem] border border-white/10 bg-white/[0.04] px-3 py-2',
        className,
      )}>
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className={cn('mt-1 text-sm font-semibold text-foreground', valueClassName)}>
        {value}
      </p>
    </div>
  );
}
