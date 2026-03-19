import React from 'react';
import { format } from 'date-fns';
import Image from 'next/image';
import { APP_LOGO_PATH, APP_NAME } from '@/lib/app-config';

type ShippingAddress = {
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  deliveryFee?: number | null;
};

type SaleLine = {
  quantity: number;
  unitPrice: number | string;
  product?: {
    name?: string | null;
    sku?: string | null;
  } | null;
};

export type ShipmentPrintSale = {
  id: string;
  orderNo: string;
  date: string | Date;
  customer: {
    name: string | null;
    phone?: string | null;
  } | null;
  shippingAddress: ShippingAddress;
  lines: SaleLine[];
  total: number;
  subtotal?: number;
  channel?: string;
};

type ShipmentPrintViewProps = {
  sales: ShipmentPrintSale[];
};

const barcodeBars = Array.from({ length: 30 }, (_, index) => ({
  width: index % 3 === 0 ? '3px' : '1.5px',
  height: index % 4 === 0 ? '100%' : '70%',
}));

export const ShipmentPrintView = React.forwardRef<
  HTMLDivElement,
  ShipmentPrintViewProps
>(({ sales }, ref) => {
  return (
    <div
      ref={ref}
      className="print-container hidden print:block print:w-full print:h-full print:bg-white print:text-black font-cairo">
      <style type="text/css" media="print">
        {`
            @page { size: auto; margin: 0mm; }
            body { background-color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          `}
      </style>
      <div className="flex flex-col gap-4 p-4 max-w-[210mm] mx-auto">
        {sales.map((sale) => (
          <div
            key={sale.id}
            className="flex flex-col border-2 border-black break-inside-avoid relative overflow-hidden"
            style={{ minHeight: '100mm' }}>
            {/* Header Section */}
            <div className="flex border-b-2 border-black">
              <div className="flex-1 p-3 border-r-2 border-black flex items-center gap-2">
                <Image
                  src={APP_LOGO_PATH}
                  alt={APP_NAME}
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <div>
                  <h1 className="text-2xl font-black tracking-tighter uppercase mb-0.5">
                    {APP_NAME}
                  </h1>
                  <p className="text-[8px] font-mono uppercase tracking-widest text-gray-500">
                    Official Packing Slip
                  </p>
                </div>
              </div>
              <div className="flex-1 p-3 flex flex-col items-end justify-center bg-black text-white">
                <h2 className="text-xl font-mono font-bold tracking-widest">
                  #{sale.orderNo}
                </h2>
                <p className="text-[8px] uppercase tracking-[0.2em] opacity-80 mt-0.5">
                  {sale.date
                    ? format(new Date(sale.date), 'MMM dd, yyyy')
                    : 'Date Unknown'}
                </p>
              </div>
            </div>

            {/* Address Grid */}
            <div className="grid grid-cols-2 border-b-2 border-black">
              <div className="p-3 border-r-2 border-black space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-black text-white text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                    Ship To
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold uppercase leading-none mb-1.5">
                    {sale.customer?.name || 'Valued Customer'}
                  </h3>
                  <div className="text-xs font-mono space-y-0.5 text-gray-600">
                    <p>
                      {sale.shippingAddress?.address || 'No Address Provided'}
                    </p>
                    <p>
                      {sale.shippingAddress?.city &&
                        `${sale.shippingAddress.city}`}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 bg-black text-white px-2 py-1 rounded inline-flex">
                    <span className="text-sm">📞</span>
                    <p className="text-sm font-bold">
                      {sale.customer?.phone || 'No Phone'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-3 space-y-2 bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="border border-black text-black text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-wider">
                    Order Details
                  </span>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-wider text-gray-500 mb-0.5">
                    Notes
                  </p>
                  <p className="font-mono text-[10px] leading-tight">
                    {sale.shippingAddress?.notes || 'No special instructions'}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="flex-1 flex flex-col">
              <div className="flex border-b border-black bg-gray-100 text-[8px] font-bold uppercase tracking-widest">
                <div className="w-12 p-2 text-center border-r border-black">
                  Qty
                </div>
                <div className="flex-1 p-2 border-r border-black">
                  Item Description
                </div>
                <div className="w-20 p-2 text-right">Price</div>
              </div>

              <div className="flex-1">
                {sale.lines.map((line, i) => (
                  <div
                    key={i}
                    className="flex border-b border-gray-200 last:border-0 text-xs">
                    <div className="w-12 p-2 text-center font-mono font-bold border-r border-gray-200 flex items-center justify-center">
                      {line.quantity}
                    </div>
                    <div className="flex-1 p-2 border-r border-gray-200">
                      <p className="font-bold text-xs">
                        {line.product?.name || 'Unknown Item'}
                      </p>
                      <p className="text-[9px] text-gray-500 font-mono mt-0.5">
                        SKU: {line.product?.sku || 'N/A'}
                      </p>
                    </div>
                    <div className="w-20 p-2 text-right font-mono flex items-center justify-end">
                      {Number(line.unitPrice).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer / Totals */}
            <div className="border-t-2 border-black bg-gray-50">
              <div className="w-full">
                <div className="flex justify-between p-2 border-b border-gray-300 text-xs">
                  <span className="uppercase tracking-wider text-gray-600 font-semibold">
                    Subtotal
                  </span>
                  <span className="font-mono font-bold">
                    JOD {Number(sale.subtotal || sale.total).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between p-2 border-b border-gray-300 text-xs">
                  <span className="uppercase tracking-wider text-gray-600 font-semibold">
                    Shipping Fee
                  </span>
                  <span className="font-mono font-bold">
                    JOD{' '}
                    {Number(sale.shippingAddress?.deliveryFee || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-black text-white items-center">
                  <span className="uppercase tracking-[0.2em] font-bold text-sm">
                    Total Amount
                  </span>
                  <span className="font-mono text-xl font-black">
                    JOD{' '}
                    {(
                      Number(sale.subtotal || sale.total) +
                      Number(sale.shippingAddress?.deliveryFee || 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Barcode / Footer */}
            <div className="p-2 border-t-2 border-black flex justify-between items-end">
              <div className="flex flex-col gap-0.5">
                <div className="h-6 flex items-end gap-[1px] opacity-80">
                  {barcodeBars.map((bar, i) => (
                    <div
                      key={i}
                      className="bg-black"
                      style={{
                        width: bar.width,
                        height: bar.height,
                      }}
                    />
                  ))}
                </div>
                <p className="text-[8px] font-mono uppercase tracking-[0.3em]">
                  {sale.id.substring(0, 18)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400">
                  Authorized Distribution
                </p>
                <p className="text-[8px] font-bold uppercase tracking-widest">
                  Thank you for your business
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

ShipmentPrintView.displayName = 'ShipmentPrintView';
