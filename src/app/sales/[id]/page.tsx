import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { SaleDetailClient } from '@/components/sales/sale-detail-client';

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
};

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id?: string }>;
}) {
  const { id: saleId } = await params;
  if (!saleId) {
    notFound();
  }

  const sale = await prisma.saleOrder.findUnique({
    where: { id: saleId },
    include: {
      customer: true,
      partner: {
        select: {
          id: true,
          name: true,
          contactName: true,
          contactPhone: true,
        },
      },
      lines: {
        include: { product: true },
      },
      orderExpenses: true,
    },
  });

  if (!sale) {
    notFound();
  }

  const shipping = (sale.shippingAddress ?? {}) as ShippingMeta;
  const fulfillmentType =
    sale.fulfillmentMode === 'ON_DEMAND'
      ? 'on-demand'
      : shipping.fulfillmentType ?? 'limited';
  const partnerLabel = sale.partner?.name ?? shipping.partnerName;
  
  type SaleLine = NonNullable<typeof sale.lines>[number];

  const totalItems =
    sale.lines?.reduce(
      (acc: number, line: SaleLine) => acc + (line.quantity ?? 0),
      0
    ) ?? 0;

  return (
    <SaleDetailClient
      sale={sale}
      fulfillmentType={fulfillmentType}
      partnerLabel={partnerLabel}
      totalItems={totalItems}
    />
  );
}
