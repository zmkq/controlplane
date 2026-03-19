'use server';

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { createAuditLog } from '@/lib/audit';
import { broadcastPushNotification } from '@/lib/push';
import { z } from 'zod';

const createSaleSchema = z
  .object({
    customerName: z.string().min(1),
    contactNumber: z.string().min(4),
    address: z.string().optional().default(''),
    city: z.string().optional(),
    deliveryMethod: z.enum(['delivery', 'pickup']),
    deliveryFee: z.number().nonnegative(),
    deliveryWindow: z.string().optional().default('Same day (<6h)'),
    isExpedited: z.boolean().optional().default(false),
    lineItems: z
      .array(
        z.object({
          productId: z.string().cuid(),
          quantity: z.number().int().positive(),
          unitPrice: z.number().positive(),
        })
      )
      .min(1, 'At least one line item is required'),
    subtotal: z.number().nonnegative().optional(), // client hint only
    total: z.number().nonnegative().optional(), // client hint only
    channel: z.string().min(2),
    orderReference: z.string().optional(),
    fulfillmentType: z.enum(['limited', 'on-demand']),
    partnerId: z.string().cuid().optional(),
    pickupLocation: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => data.fulfillmentType === 'limited' || Boolean(data.partnerId),
    {
      path: ['partnerId'],
      message: 'Partner is required for on-demand orders.',
    }
  );

export async function getProducts() {
  const products = await prisma.product.findMany();
  return products.map((product) => ({
    value: String(product.id),
    label: `${String(product.name)} - ${String(product.flavor)} - ${String(
      product.size
    )}${product.isBundle ? ' 📦 [BUNDLE]' : ''}`,
    cost: Number(product.cost ?? 0),
    imageUrl: product.images || null,
    isBundle: product.isBundle,
    price: product.price ? Number(product.price) : undefined,
  }));
}

export async function getAgents() {
  const agents = await prisma.supplier.findMany({
    orderBy: { name: 'asc' },
  });

  return agents.map((agent) => ({
    value: agent.id,
    label: agent.name,
    leadTime: agent.defaultLeadTimeDays ?? 24,
  }));
}

export async function getOrderForDuplicate(orderId: string) {
  const order = await prisma.saleOrder.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      lines: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    return null;
  }

  return {
    lines: order.lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      unitCost: Number(line.product?.cost ?? 0),
    })),
  };
}

export async function createSale(data: z.infer<typeof createSaleSchema>) {
  const validatedData = createSaleSchema.safeParse(data);

  if (!validatedData.success) {
    throw new Error(validatedData.error.message);
  }

  const {
    customerName,
    contactNumber,
    address,
    city,
    deliveryMethod,
    deliveryFee,
    deliveryWindow,
    isExpedited,
    lineItems,
    channel,
    orderReference,
    fulfillmentType,
    partnerId,
    pickupLocation,
    notes,
  } = validatedData.data;

  let partnerRecord: { id: string; name: string } | null = null;
  const isOnDemand = fulfillmentType === 'on-demand';

  const result = await prisma.$transaction(async (tx) => {
    const normalizedChannel = channel.trim().toLowerCase();

    const productIds = lineItems.map((item) => item.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        quantity: true,
        attributes: true,
        cost: true,
        isBundle: true,
        bundleItems: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new Error('One or more products no longer exist.');
    }

    const productMap = new Map(
      products.map((product) => [product.id, product])
    );

    const computedLineItems = lineItems.map((item) => {
      const product = productMap.get(item.productId)!;
      const attr =
        product.attributes &&
        typeof product.attributes === 'object' &&
        !Array.isArray(product.attributes)
          ? (product.attributes as { fulfillmentMode?: string })
          : {};
      const productMode =
        attr.fulfillmentMode === 'on-demand' ? 'on-demand' : 'limited';

      if (isOnDemand && productMode !== 'on-demand' && !product.isBundle) {
        throw new Error(
          `${product.name} is stocked locally. Switch to limited fulfillment or adjust the SKU.`
        );
      }

      if (!isOnDemand && productMode === 'on-demand' && !product.isBundle) {
        throw new Error(
          `${product.name} is only available via partners. Switch fulfillment to on-demand.`
        );
      }

      if (!isOnDemand && !product.isBundle && product.quantity < item.quantity) {
        throw new Error(
          `Not enough inventory for ${product.name}. Available: ${product.quantity}`
        );
      }

      const unitPrice = Number(item.unitPrice);
      const unitCost = Number(product.cost ?? 0);
      const lineTotal = unitPrice * item.quantity;
      return {
        ...item,
        unitPrice,
        unitCost,
        lineTotal,
        productCost: unitCost,
        isBundle: product.isBundle,
        bundleItems: product.bundleItems,
      };
    });

    const subtotalCalc = computedLineItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0
    );
    if (subtotalCalc <= 0) {
      throw new Error('Subtotal must be greater than zero.');
    }

    const effectiveDeliveryFee =
      deliveryMethod === 'delivery' ? deliveryFee : 0;
    const grandTotal = subtotalCalc;

    if (isOnDemand) {
      partnerRecord = await tx.supplier.findUnique({
        where: { id: partnerId ?? '' },
        select: { id: true, name: true },
      });
      if (!partnerRecord) {
        throw new Error('Selected partner can no longer be found.');
      }
    }

    let customer = await tx.customer.findUnique({
      where: { phone: contactNumber },
    });

    if (!customer) {
      customer = await tx.customer.create({
        data: {
          name: customerName,
          phone: contactNumber,
          addressLine1: address,
        },
      });
    } else if (
      customer.name !== customerName ||
      customer.addressLine1 !== address
    ) {
      customer = await tx.customer.update({
        where: { id: customer.id },
        data: {
          name: customerName,
          addressLine1: address || customer.addressLine1,
        },
      });
    }

    const saleOrder = await tx.saleOrder.create({
      data: {
        customerId: customer.id,
        subtotal: subtotalCalc,
        total: grandTotal,
        orderNo: `SO-${Date.now()}`,
        date: new Date(),
        channel: normalizedChannel,
        status: isOnDemand ? 'AWAITING_SUPPLIER' : 'AWAITING_DELIVERY',
        partnerId: partnerRecord?.id ?? null,
        fulfillmentMode: isOnDemand ? 'ON_DEMAND' : 'LIMITED',
        shippingAddress: {
          contactNumber,
          address,
          city,
          deliveryMethod,
          deliveryFee: effectiveDeliveryFee,
          deliveryWindow,
          isExpedited,
          pickupLocation,
          notes,
          channel: normalizedChannel,
          orderReference,
          fulfillmentType,
          partnerId: partnerRecord?.id,
          partnerName: partnerRecord?.name,
        },
        paymentMethod: 'COD',
      },
    });

    // OPTIMIZED: Pre-fetch all inventory lots for all products in ONE query
    const allProductIds = new Set<string>();
    for (const item of computedLineItems) {
      if (!isOnDemand) {
        if (item.isBundle && item.bundleItems) {
          for (const bundleItem of item.bundleItems) {
            allProductIds.add(bundleItem.productId);
          }
        } else {
          allProductIds.add(item.productId);
        }
      }
    }

    // Fetch all inventory lots at once
    const allInventoryLots = await tx.inventoryLot.findMany({
      where: {
        productId: { in: Array.from(allProductIds) },
        quantity: { gt: 0 },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group lots by productId for easy access
    const lotsByProduct = new Map<string, typeof allInventoryLots>();
    for (const lot of allInventoryLots) {
      if (!lotsByProduct.has(lot.productId)) {
        lotsByProduct.set(lot.productId, []);
      }
      lotsByProduct.get(lot.productId)!.push(lot);
    }

    // Track lot updates to batch them
    const lotUpdates = new Map<string, number>(); // lotId -> quantity to decrement
    const productUpdates = new Map<string, number>(); // productId -> quantity to decrement

    // Process all line items and calculate COGS
    const lineItemsWithCogs = [];

    for (const item of computedLineItems) {
      let cogs = 0;

      if (!isOnDemand) {
        if (item.isBundle && item.bundleItems) {
          // Handle bundle inventory deduction
          for (const bundleItem of item.bundleItems) {
            let quantityToDeduct = item.quantity * bundleItem.quantity;
            const lots = lotsByProduct.get(bundleItem.productId) || [];

            for (const lot of lots) {
              if (quantityToDeduct === 0) break;

              const availableInLot = lot.quantity - (lotUpdates.get(lot.id) || 0);
              if (availableInLot <= 0) continue;

              const quantityFromLot = Math.min(availableInLot, quantityToDeduct);
              cogs += quantityFromLot * lot.cost;
              quantityToDeduct -= quantityFromLot;

              lotUpdates.set(lot.id, (lotUpdates.get(lot.id) || 0) + quantityFromLot);
            }

            if (quantityToDeduct > 0) {
              // Fallback to product cost if not enough lots
              const product = productMap.get(bundleItem.productId);
              cogs += quantityToDeduct * (product?.cost ?? 0);
            }

            // Track product quantity updates
            const totalDeduct = item.quantity * bundleItem.quantity;
            productUpdates.set(
              bundleItem.productId,
              (productUpdates.get(bundleItem.productId) || 0) + totalDeduct
            );
          }
        } else {
          // Handle regular product inventory deduction
          let quantityToDeduct = item.quantity;
          const lots = lotsByProduct.get(item.productId) || [];

          for (const lot of lots) {
            if (quantityToDeduct === 0) break;

            const availableInLot = lot.quantity - (lotUpdates.get(lot.id) || 0);
            if (availableInLot <= 0) continue;

            const quantityFromLot = Math.min(availableInLot, quantityToDeduct);
            cogs += quantityFromLot * lot.cost;
            quantityToDeduct -= quantityFromLot;

            lotUpdates.set(lot.id, (lotUpdates.get(lot.id) || 0) + quantityFromLot);
          }

          if (quantityToDeduct > 0) {
            const fallbackUnitCost = item.productCost ?? item.unitCost ?? 0;
            cogs += quantityToDeduct * fallbackUnitCost;
          }

          // Track product quantity updates
          productUpdates.set(
            item.productId,
            (productUpdates.get(item.productId) || 0) + item.quantity
          );
        }
      } else {
        cogs = item.unitCost * item.quantity;
      }

      lineItemsWithCogs.push({
        saleOrderId: saleOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        cogs,
      });
    }

    // BATCH UPDATE: Apply all inventory lot updates
    await Promise.all(
      Array.from(lotUpdates.entries()).map(([lotId, decrementQty]) =>
        tx.inventoryLot.update({
          where: { id: lotId },
          data: { quantity: { decrement: decrementQty } },
        })
      )
    );

    // BATCH UPDATE: Apply all product quantity updates
    await Promise.all(
      Array.from(productUpdates.entries()).map(([productId, decrementQty]) =>
        tx.product.update({
          where: { id: productId },
          data: { quantity: { decrement: decrementQty } },
        })
      )
    );

    // BATCH CREATE: Create all sale order lines at once
    await tx.saleOrderLine.createMany({
      data: lineItemsWithCogs,
    });

    const notification = await tx.notification.create({
      data: {
        title: 'New Order',
        body: isOnDemand
          ? partnerRecord
            ? `${saleOrder.orderNo} • Awaiting ${partnerRecord.name} confirmation`
            : `${saleOrder.orderNo} • Await partner confirmation`
          : `${saleOrder.orderNo} • Packed from limited stock`,
        saleOrderId: saleOrder.id,
      },
    });

    // NOTE: createAuditLog is moved outside transaction to prevent deadlock

    return {
      saleOrderId: saleOrder.id,
      orderNo: saleOrder.orderNo,
      notificationId: notification.id,
      partnerName: partnerRecord?.name ?? null,
    };
  }, {
    maxWait: 30000, // 30 seconds max wait to acquire a transaction
    timeout: 60000, // 60 seconds max transaction time
  });

  // Create audit log AFTER transaction completes (fire-and-forget to not block redirect)
  createAuditLog('CREATE_SALE', { saleOrderId: result.saleOrderId, data })
    .catch((err) => console.error('[Audit] Failed to create log:', err));

  // Broadcast push notification after transaction completes (fire-and-forget)
  broadcastPushNotification({
    title: 'New Order',
    body: isOnDemand
      ? result.partnerName
        ? `${result.orderNo} • Awaiting ${result.partnerName} confirmation`
        : `${result.orderNo} • Await partner confirmation`
      : `${result.orderNo} • Packed from limited stock`,
    notificationId: result.notificationId,
    saleOrderId: result.saleOrderId,
  }).catch((err) => console.error('[Push] Failed to broadcast:', err));

  redirect(`/sales/${result.saleOrderId}`);
}
