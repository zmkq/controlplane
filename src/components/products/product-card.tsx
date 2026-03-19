'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Edit, Trash2, Package } from 'lucide-react';
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

function ProductImagePlaceholder({ name, brand }: { name: string; brand: string }) {
  const initial = name.charAt(0).toUpperCase();
  const hash = name
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
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
      <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{brand}</div>
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

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border border-border/50 bg-card transition-all hover:border-primary/30 hover:shadow-md',
        !active && 'opacity-70',
      )}>
      {/* Image Section - Compact */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/30">
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
                'object-cover transition-all group-hover:scale-105',
                imageLoading ? 'opacity-0' : 'opacity-100'
              )}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          </>
        ) : (
          <ProductImagePlaceholder name={name} brand={brand} />
        )}

        {/* Status & Fulfillment Badges */}
        <div className="absolute left-2 top-2 flex items-center gap-1.5">
          {!active && (
            <span className="inline-flex items-center rounded-md border border-white/20 bg-black/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/80">
              Inactive
            </span>
          )}
        </div>
        <div className="absolute right-2 top-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider',
              fulfillmentMode === 'on-demand'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'bg-primary/20 text-primary border border-primary/30'
            )}>
            {fulfillmentMode === 'on-demand' ? 'On-D' : 'Ltd'}
          </span>
        </div>

        {/* Low Stock Warning */}
        {lowStock && fulfillmentMode === 'limited' && (
          <div className="absolute bottom-0 left-0 right-0 bg-destructive/90 px-2 py-0.5">
            <p className="text-[9px] font-bold text-destructive-foreground uppercase tracking-wide text-center">
              Low Stock
            </p>
          </div>
        )}
      </div>

      {/* Content Section - Compact */}
      <div className="p-2 space-y-1.5">
        {/* Header */}
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            {brand}
          </p>
          <h3 className="text-xs font-semibold text-foreground leading-tight line-clamp-2 min-h-[2.5rem]">
            {name}
          </h3>
          <p className="truncate text-[10px] text-muted-foreground">
            {size || sku}
          </p>
        </div>

        {/* Details Grid - 2x2 compact */}
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          <div>
            <span className="text-muted-foreground">Stock:</span>
            <span className={cn(
              "ml-1 font-mono font-semibold",
              lowStock && fulfillmentMode === 'limited' ? 'text-destructive' : 'text-foreground'
            )}>
              {fulfillmentMode === 'on-demand' ? '∞' : quantity}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">$:</span>
            <span className="ml-1 font-mono font-semibold text-foreground">
              {currencyFormatter.format(cost)}
            </span>
          </div>
          {flavor && (
            <div className="col-span-2 truncate">
              <span className="text-muted-foreground">Flavor:</span>
              <span className="ml-1 text-foreground">{flavor}</span>
            </div>
          )}
        </div>


        {/* Actions - Always visible on mobile, hover on desktop */}
        <div className="flex gap-1 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1 h-7 text-[10px] border-border/50 hover:border-primary/50 hover:bg-primary/5"
          >
            <Edit className="mr-1 h-3 w-3" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            aria-label="Delete product"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
