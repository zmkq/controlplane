import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { EditOrderForm } from './edit-form';

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
      <EditOrderForm sale={sale} products={products} />
    </div>
  );
}
