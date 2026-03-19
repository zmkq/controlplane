import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CustomerSaleView } from '@/components/sales/customer-sale-view';

type ShippingMeta = {
  contactNumber?: string;
  deliveryMethod?: 'delivery' | 'pickup';
  address?: string;
  pickupLocation?: string;
  deliveryWindow?: string;
  notes?: string;
  city?: string;
};

export default async function CustomerSalePage({
  params,
}: {
  params: Promise<{ id?: string }>;
}) {
  const { id: saleId } = await params;
  if (!saleId) {
    notFound();
  }

  // Fetch ONLY safe, customer-facing data
  // Explicitly exclude: cogs, cost, profit, supplier info, internal notes
  const sale = await prisma.saleOrder.findUnique({
    where: { id: saleId },
    select: {
      id: true,
      orderNo: true,
      date: true,
      status: true,
      subtotal: true,
      discounts: true,
      shippingFee: true,
      total: true,
      shippingAddress: true,
      paymentMethod: true,
      customer: {
        select: {
          name: true,
          // Deliberately NOT including phone/email for privacy
        },
      },
      lines: {
        select: {
          quantity: true,
          unitPrice: true,
          lineTotal: true,
          product: {
            select: {
              name: true,
              brand: true,
              flavor: true,
              size: true,
              images: true,
              // Explicitly NOT including: cost, cogs, supplier info
            },
          },
        },
      },
      // Explicitly NOT including: partner, supplierPOs, customCostOverride, customProfitOverride
    },
  });

  if (!sale) {
    notFound();
  }

  const shipping = (sale.shippingAddress ?? {}) as ShippingMeta;

  return (
    <CustomerSaleView
      sale={sale}
      shipping={shipping}
    />
  );
}
