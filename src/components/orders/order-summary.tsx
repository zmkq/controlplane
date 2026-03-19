'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LineItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
}

interface OrderSummaryProps {
  channel: string;
  customerName: string;
  customerContact?: string;
  address?: string;
  city?: string;
  fulfillmentType: 'limited' | 'on-demand';
  subtotal: number;
  total: number;
  lineItems: LineItem[];
  margin: number;
  profit: number;
  deliveryWindow: string;
  deliveryFee?: number;
  notes?: string;
  deliveryMethod: 'delivery' | 'pickup';
}

export function OrderSummary({
  channel,
  customerName,
  customerContact,
  address,
  city,
  fulfillmentType,
  subtotal,
  total,
  lineItems,
  margin,
  profit,
  deliveryWindow,
  deliveryFee,
  notes,
  deliveryMethod,
}: OrderSummaryProps) {
  return (
    <motion.div
      layout
      className="glass-panel rounded-3xl border border-border/60 bg-background/50 p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Overview</p>
          <p className="text-lg font-semibold text-foreground">{customerName || 'Customer TBD'}</p>
          <p className="text-sm text-muted-foreground capitalize">{channel} channel</p>
          {customerContact && (
            <p className="text-xs text-muted-foreground mt-1">Contact: {customerContact}</p>
          )}
          {address && deliveryMethod === 'delivery' && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Address: {address}
              {city && <span className="text-primary font-semibold ml-1">• {city}</span>}
            </p>
          )}
        </div>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide',
            fulfillmentType === 'limited'
              ? 'brand-glow border border-transparent text-primary-foreground'
              : 'border border-border/60 bg-background/40 text-muted-foreground'
          )}
        >
          {fulfillmentType === 'limited' ? 'Limited stock' : 'On-demand'}
        </span>
      </div>

      <div className="space-y-3">
        {lineItems.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
            Items will appear here as you add them to the order.
          </p>
        ) : (
          lineItems.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/30 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-semibold text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} units x JOD {item.unitPrice.toFixed(2)}
                </p>
                {typeof item.unitCost === 'number' && (
                  <p className="text-[11px] text-muted-foreground">
                    Cost JOD {(item.unitCost ?? 0).toFixed(2)} | Profit JOD {(
                      (item.unitPrice - (item.unitCost ?? 0)) * item.quantity
                    ).toFixed(2)}
                  </p>
                )}
              </div>
              <p className="text-sm font-semibold text-foreground">
                JOD {(item.quantity * item.unitPrice).toFixed(2)}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2 rounded-3xl border border-border/60 bg-background/30 p-3 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>JOD {subtotal.toFixed(2)}</span>
        </div>
        {deliveryMethod === 'delivery' && typeof deliveryFee === 'number' && (
          <div className="flex justify-between text-muted-foreground text-xs">
            <span>Courier fee (customer pays driver)</span>
            <span>JOD {deliveryFee.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>Gross profit</span>
          <span className={profit >= 0 ? 'text-emerald-300' : 'text-destructive'}>
            {profit >= 0 ? '+' : '-'}JOD {Math.abs(profit).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Margin</span>
          <span className={margin >= 0 ? 'text-emerald-300' : 'text-destructive'}>
            {margin >= 0 ? '+' : ''}{margin.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between text-base font-semibold text-foreground">
          <span>Total due</span>
          <span>JOD {total.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/30 px-3 py-2 text-sm">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Delivery window</p>
          <p className="text-base font-semibold text-foreground">{deliveryWindow}</p>
        </div>
        <p className="text-xs text-muted-foreground">We will notify when the partner confirms pickup.</p>
      </div>

      {notes && (
        <div className="rounded-2xl border border-dashed border-border/60 bg-background/30 px-3 py-2 text-sm text-muted-foreground">
          {notes}
        </div>
      )}
    </motion.div>
  );
}
