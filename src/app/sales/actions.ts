'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { saleStatuses, SaleStatus } from '@/app/sales/statuses';
import { broadcastPushNotification } from '@/lib/push';

const deleteSaleSchema = z.object({
  id: z.string().cuid(),
});

const updateSaleStatusSchema = z.object({
  id: z.string().cuid(),
  status: z.enum([...saleStatuses] as [SaleStatus, ...SaleStatus[]]),
});

export async function deleteSale(input: z.infer<typeof deleteSaleSchema>) {
  const { id } = deleteSaleSchema.parse(input);

  await prisma.$transaction(async (tx) => {
    // Fetch order with lines and product info before deletion
    const order = await tx.saleOrder.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Restore stock for LIMITED fulfillment orders
    if (order.fulfillmentMode === 'LIMITED') {
      for (const line of order.lines) {
        const quantityToRestore = line.quantity;
        const productId = line.productId;

        // Restore product quantity
        await tx.product.update({
          where: { id: productId },
          data: {
            quantity: {
              increment: quantityToRestore,
            },
          },
        });

        // Restore InventoryLot - create new lot with restored quantity at average cost
        // Calculate average cost from existing lots or use product cost
        const existingLots = await tx.inventoryLot.findMany({
          where: {
            productId,
            quantity: {
              gt: 0,
            },
          },
        });

        let averageCost = Number(line.product?.cost ?? 0);
        if (existingLots.length > 0) {
          const totalCost = existingLots.reduce(
            (sum, lot) => sum + lot.cost * lot.quantity,
            0
          );
          const totalQuantity = existingLots.reduce(
            (sum, lot) => sum + lot.quantity,
            0
          );
          if (totalQuantity > 0) {
            averageCost = totalCost / totalQuantity;
          }
        } else if (line.cogs && line.cogs > 0) {
          // Use COGS from the order line if available
          averageCost = line.cogs / quantityToRestore;
        }

        // Create new lot with restored quantity
        await tx.inventoryLot.create({
          data: {
            productId,
            quantity: quantityToRestore,
            cost: averageCost,
          },
        });
      }
    }

    // Delete related records
    await tx.courierBooking.deleteMany({ where: { saleOrderId: id } });
    await tx.refund.deleteMany({ where: { saleOrderId: id } });
    await tx.supplierPO.deleteMany({ where: { saleOrderId: id } });
    await tx.saleOrderLine.deleteMany({ where: { saleOrderId: id } });
    await tx.saleOrder.delete({ where: { id } });
  });

  revalidatePath('/sales');
  revalidatePath(`/sales/${id}`);
  revalidatePath('/');
  revalidatePath('/products');
  revalidatePath('/dashboard');
}

export async function duplicateSale(saleId: string) {
  const sale = await prisma.saleOrder.findUnique({
    where: { id: saleId },
    include: {
      customer: true,
      lines: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!sale) {
    throw new Error('Sale order not found');
  }

  const shipping = sale.shippingAddress as {
    contactNumber?: string;
    address?: string;
    deliveryMethod?: 'delivery' | 'pickup';
    deliveryFee?: number;
    deliveryWindow?: string;
    isExpedited?: boolean;
    pickupLocation?: string;
    notes?: string;
    channel?: string;
    orderReference?: string;
    fulfillmentType?: string;
    partnerId?: string;
    partnerName?: string;
  };

  // Redirect to new sale page with query params for pre-population
  const params = new URLSearchParams({
    duplicate: saleId,
    customerName: sale.customer?.name ?? '',
    contactNumber: shipping.contactNumber ?? sale.customer?.phone ?? '',
    address: shipping.address ?? sale.customer?.addressLine1 ?? '',
    channel: sale.channel ?? 'instagram',
    deliveryMethod: shipping.deliveryMethod ?? 'delivery',
    deliveryFee: String(shipping.deliveryFee ?? 0),
    deliveryWindow: shipping.deliveryWindow ?? 'Same day (<6h)',
    isExpedited: String(shipping.isExpedited ?? false),
    pickupLocation: shipping.pickupLocation ?? '',
    notes: shipping.notes ?? '',
    fulfillmentType: sale.fulfillmentMode === 'ON_DEMAND' ? 'on-demand' : 'limited',
    partnerId: sale.partnerId ?? '',
    orderReference: shipping.orderReference ?? '',
  });

  return `/sales/new?${params.toString()}`;
}

export async function updateSaleStatus(formData: FormData) {
  const parsed = updateSaleStatusSchema.safeParse({
    id: formData.get('saleId'),
    status: formData.get('status'),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid status payload');
  }

  const { id, status } = parsed.data;

  // Get the order before updating to compare status
  const order = await prisma.saleOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      partner: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const oldStatus = order.status;
  
  await prisma.saleOrder.update({
    where: { id },
    data: { status },
  });

  // Create notification for important status changes
  const importantStatuses: SaleStatus[] = [
    'DELIVERED',
    'OUT_FOR_DELIVERY',
    'SUPPLIER_CONFIRMED',
    'CANCELED',
    'RETURNED',
  ];

  if (importantStatuses.includes(status) && oldStatus !== status) {
    const statusMessages: Record<SaleStatus, string> = {
      DELIVERED: 'Order Delivered',
      OUT_FOR_DELIVERY: 'Out for Delivery',
      SUPPLIER_CONFIRMED: 'Partner Confirmed',
      CANCELED: 'Order Canceled',
      RETURNED: 'Order Returned',
      DRAFT: '',
      AWAITING_SUPPLIER: '',
      AWAITING_DELIVERY: '',
    };

    const statusBodies: Record<SaleStatus, string> = {
      DELIVERED: `${order.orderNo} • ${order.customer?.name ?? 'Customer'}`,
      OUT_FOR_DELIVERY: `${order.orderNo} • En route to ${order.customer?.name ?? 'customer'}`,
      SUPPLIER_CONFIRMED: order.partner?.name
        ? `${order.orderNo} • ${order.partner.name} preparing`
        : `${order.orderNo} • Partner preparing`,
      CANCELED: `${order.orderNo} • Order canceled`,
      RETURNED: `${order.orderNo} • Return processed`,
      DRAFT: '',
      AWAITING_SUPPLIER: '',
      AWAITING_DELIVERY: '',
    };

    const notification = await prisma.notification.create({
      data: {
        title: statusMessages[status],
        body: statusBodies[status],
        saleOrderId: id,
      },
    });

    // Broadcast push notification
    await broadcastPushNotification({
      title: statusMessages[status],
      body: statusBodies[status],
      notificationId: notification.id,
      saleOrderId: id,
    });
  }

  revalidatePath('/sales');
  revalidatePath(`/sales/${id}`);
}

const bulkUpdateSaleStatusSchema = z.object({
  ids: z.array(z.string().cuid()).min(1),
  status: z.enum([...saleStatuses] as [SaleStatus, ...SaleStatus[]]),
});

export async function bulkUpdateSaleStatus(input: z.infer<typeof bulkUpdateSaleStatusSchema>) {
  const { ids, status } = bulkUpdateSaleStatusSchema.parse(input);

  // Fetch all orders first
  const orders = await prisma.saleOrder.findMany({
    where: { id: { in: ids } },
    include: {
      customer: true,
      partner: {
        select: {
          name: true,
        },
      },
    },
  });

  if (orders.length === 0) {
    throw new Error('No orders found');
  }

  const changedOrders = orders.filter((order) => order.status !== status);

  if (changedOrders.length === 0) {
    return {
      updatedCount: 0,
      skippedCount: orders.length,
      status,
    };
  }

  // Update all orders in a single transaction
  await prisma.$transaction(async (tx) => {
    // Batch update only orders that actually changed
    await tx.saleOrder.updateMany({
      where: { id: { in: changedOrders.map((order) => order.id) } },
      data: { status },
    });

    // Only create notifications for important status changes
    const importantStatuses: SaleStatus[] = [
      'DELIVERED',
      'OUT_FOR_DELIVERY',
      'SUPPLIER_CONFIRMED',
      'CANCELED',
      'RETURNED',
    ];

    if (importantStatuses.includes(status)) {
      const statusMessages: Record<SaleStatus, string> = {
        DELIVERED: 'Order Delivered',
        OUT_FOR_DELIVERY: 'Out for Delivery',
        SUPPLIER_CONFIRMED: 'Partner Confirmed',
        CANCELED: 'Order Canceled',
        RETURNED: 'Order Returned',
        DRAFT: '',
        AWAITING_SUPPLIER: '',
        AWAITING_DELIVERY: '',
      };

      // Create notifications for orders that changed status
      const notificationsToCreate = changedOrders.map(order => {
          const statusBodies: Record<SaleStatus, string> = {
            DELIVERED: `${order.orderNo} • ${order.customer?.name ?? 'Customer'}`,
            OUT_FOR_DELIVERY: `${order.orderNo} • En route to ${order.customer?.name ?? 'customer'}`,
            SUPPLIER_CONFIRMED: order.partner?.name
              ? `${order.orderNo} • ${order.partner.name} preparing`
              : `${order.orderNo} • Partner preparing`,
            CANCELED: `${order.orderNo} • Order canceled`,
            RETURNED: `${order.orderNo} • Return processed`,
            DRAFT: '',
            AWAITING_SUPPLIER: '',
            AWAITING_DELIVERY: '',
          };

          return {
            title: statusMessages[status],
            body: statusBodies[status],
            saleOrderId: order.id,
          };
      });

      // Batch create notifications
      if (notificationsToCreate.length > 0) {
        await tx.notification.createMany({
          data: notificationsToCreate,
        });
      }
    }
  });

  // Send push notifications asynchronously (don't await)
  const importantStatuses: SaleStatus[] = [
    'DELIVERED',
    'OUT_FOR_DELIVERY',
    'SUPPLIER_CONFIRMED',
    'CANCELED',
    'RETURNED',
  ];

  if (importantStatuses.includes(status)) {
    // Fire and forget - don't block the response
    Promise.all(
      changedOrders.map(async (order) => {
          const statusMessages: Record<SaleStatus, string> = {
            DELIVERED: 'Order Delivered',
            OUT_FOR_DELIVERY: 'Out for Delivery',
            SUPPLIER_CONFIRMED: 'Partner Confirmed',
            CANCELED: 'Order Canceled',
            RETURNED: 'Order Returned',
            DRAFT: '',
            AWAITING_SUPPLIER: '',
            AWAITING_DELIVERY: '',
          };

          const statusBodies: Record<SaleStatus, string> = {
            DELIVERED: `${order.orderNo} • ${order.customer?.name ?? 'Customer'}`,
            OUT_FOR_DELIVERY: `${order.orderNo} • En route to ${order.customer?.name ?? 'customer'}`,
            SUPPLIER_CONFIRMED: order.partner?.name
              ? `${order.orderNo} • ${order.partner.name} preparing`
              : `${order.orderNo} • Partner preparing`,
            CANCELED: `${order.orderNo} • Order canceled`,
            RETURNED: `${order.orderNo} • Return processed`,
            DRAFT: '',
            AWAITING_SUPPLIER: '',
            AWAITING_DELIVERY: '',
          };

          try {
            await broadcastPushNotification({
              title: statusMessages[status],
              body: statusBodies[status],
              saleOrderId: order.id,
            });
          } catch (error) {
            console.error(`Failed to send push notification for order ${order.id}:`, error);
          }
      })
    ).catch(error => {
      console.error('Failed to send some push notifications:', error);
    });
  }

  revalidatePath('/sales');
  revalidatePath('/');

  return {
    updatedCount: changedOrders.length,
    skippedCount: orders.length - changedOrders.length,
    status,
  };
}
