import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { EditOrderForm } from './edit-form';

type ShippingMeta = {
  contactNumber?: string;
  address?: string;
  deliveryFee?: number;
  notes?: string;
};

export default async function EditOrderPage({
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
        },
      },
      lines: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              flavor: true,
              size: true,
              images: true,
              cost: true,
              quantity: true,
              isBundle: true,
              price: true,
            },
          },
        },
      },
      orderExpenses: true,
    },
  });

  if (!sale) {
    notFound();
  }

  const saleForForm = {
    ...sale,
    shippingAddress: normalizeShippingMeta(sale.shippingAddress),
  };

  // Get all products for adding new lines
  const products = await prisma.product.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      flavor: true,
      size: true,
      cost: true,
      price: true,
      images: true,
      quantity: true,
      isBundle: true,
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="min-h-screen px-4 pb-24 pt-6 sm:px-6 lg:px-10">
      <EditOrderForm sale={saleForForm} products={products} />
    </div>
  );
}

function normalizeShippingMeta(value: unknown): ShippingMeta | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const shipping = value as Record<string, unknown>;
  const normalized: ShippingMeta = {};

  if (typeof shipping.contactNumber === 'string') {
    normalized.contactNumber = shipping.contactNumber;
  }

  if (typeof shipping.address === 'string') {
    normalized.address = shipping.address;
  }

  if (typeof shipping.deliveryFee === 'number') {
    normalized.deliveryFee = shipping.deliveryFee;
  }

  if (typeof shipping.notes === 'string') {
    normalized.notes = shipping.notes;
  }

  return normalized;
}
