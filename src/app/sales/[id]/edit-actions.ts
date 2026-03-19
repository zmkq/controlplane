'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit';

// ============================================================================
// SCHEMAS
// ============================================================================

const addOrderLineSchema = z.object({
  saleOrderId: z.string().cuid(),
  productId: z.string().cuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  customCost: z.number().nonnegative().optional(),
});

const updateOrderLineSchema = z.object({
  lineId: z.string().cuid(),
  quantity: z.number().int().positive().optional(),
  unitPrice: z.number().positive().optional(),
  customCost: z.number().nonnegative().optional(),
});

const removeOrderLineSchema = z.object({
  lineId: z.string().cuid(),
});

const addOrderExpenseSchema = z.object({
  saleOrderId: z.string().cuid(),
  category: z.enum(['SHAKER', 'PACKAGING', 'HANDLING', 'GIFT_WRAP', 'RUSH_FEE', 'MISC']),
  description: z.string().optional(),
  amount: z.number().positive(),
});

const removeOrderExpenseSchema = z.object({
  expenseId: z.string().cuid(),
});

const updateOrderTotalsSchema = z.object({
  saleOrderId: z.string().cuid(),
  customCostOverride: z.number().nonnegative().optional().nullable(),
  customProfitOverride: z.number().nonnegative().optional().nullable(),
});

const updateOrderHeaderSchema = z.object({
  saleOrderId: z.string().cuid(),
  customerName: z.string().min(1).optional(),
  contactNumber: z.string().min(4).optional(),
  address: z.string().optional(),
  deliveryFee: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// ORDER LINE ACTIONS
// ============================================================================

export async function addOrderLine(data: z.infer<typeof addOrderLineSchema>) {
  const validated = addOrderLineSchema.parse(data);
  const { saleOrderId, productId, quantity, unitPrice, customCost } = validated;

  const result = await prisma.$transaction(async (tx) => {
    // Get order to check fulfillment mode
    const order = await tx.saleOrder.findUnique({
      where: { id: saleOrderId },
      select: { fulfillmentMode: true, orderNo: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Get product details
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        quantity: true,
        cost: true,
        isBundle: true,
        bundleItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const isLimited = order.fulfillmentMode === 'LIMITED';

    // Check inventory for LIMITED orders
    if (isLimited && !product.isBundle && product.quantity < quantity) {
      throw new Error(
        `Insufficient inventory for ${product.name}. Available: ${product.quantity}`
      );
    }

    let cogs = 0;

    // Handle inventory deduction for LIMITED orders
    if (isLimited) {
      if (product.isBundle && product.bundleItems.length > 0) {
        // Handle bundle inventory deduction
        for (const bundleItem of product.bundleItems) {
          const totalNeeded = quantity * bundleItem.quantity;

          const inventoryLots = await tx.inventoryLot.findMany({
            where: {
              productId: bundleItem.productId,
              quantity: { gt: 0 },
            },
            orderBy: { createdAt: 'asc' },
          });

          let remaining = totalNeeded;
          for (const lot of inventoryLots) {
            if (remaining === 0) break;

            const deduct = Math.min(lot.quantity, remaining);
            cogs += deduct * lot.cost;
            remaining -= deduct;

            await tx.inventoryLot.update({
              where: { id: lot.id },
              data: { quantity: { decrement: deduct } },
            });
          }

          // Fallback to product cost if lots insufficient
          if (remaining > 0) {
            cogs += remaining * (bundleItem.product.cost ?? 0);
          }

          // Update product quantity
          await tx.product.update({
            where: { id: bundleItem.productId },
            data: { quantity: { decrement: totalNeeded } },
          });
        }
      } else {
        // Handle regular product inventory deduction
        const inventoryLots = await tx.inventoryLot.findMany({
          where: {
            productId: productId,
            quantity: { gt: 0 },
          },
          orderBy: { createdAt: 'asc' },
        });

        let remaining = quantity;
        for (const lot of inventoryLots) {
          if (remaining === 0) break;

          const deduct = Math.min(lot.quantity, remaining);
          cogs += deduct * lot.cost;
          remaining -= deduct;

          await tx.inventoryLot.update({
            where: { id: lot.id },
            data: { quantity: { decrement: deduct } },
          });
        }

        // Fallback to product cost if lots insufficient
        if (remaining > 0) {
          cogs += remaining * (product.cost ?? 0);
        }

        // Update product quantity
        await tx.product.update({
          where: { id: productId },
          data: { quantity: { decrement: quantity } },
        });
      }
    } else {
      // ON_DEMAND: use product cost
      cogs = (customCost ?? product.cost ?? 0) * quantity;
    }

    // Create the order line
    const lineTotal = unitPrice * quantity;
    const newLine = await tx.saleOrderLine.create({
      data: {
        saleOrderId,
        productId,
        quantity,
        unitPrice,
        lineTotal,
        cogs: customCost ? customCost * quantity : cogs,
      },
    });

    // Recalculate order totals
    await recalculateOrderTotals(tx, saleOrderId);

    return newLine;
  });

  await createAuditLog('EDIT_SALE', {
    action: 'ADD_LINE',
    saleOrderId,
    data: validated,
  });

  revalidatePath(`/sales/${saleOrderId}`);
  revalidatePath(`/sales/${saleOrderId}/edit`);
  revalidatePath('/sales');
  revalidatePath('/products');

  return { success: true, lineId: result.id };
}

export async function updateOrderLine(data: z.infer<typeof updateOrderLineSchema>) {
  const validated = updateOrderLineSchema.parse(data);
  const { lineId, quantity, unitPrice, customCost } = validated;

  const result = await prisma.$transaction(async (tx) => {
    // Get existing line
    const existingLine = await tx.saleOrderLine.findUnique({
      where: { id: lineId },
      include: {
        saleOrder: {
          select: { fulfillmentMode: true, id: true },
        },
        product: {
          select: {
            id: true,
            name: true,
            quantity: true,
            cost: true,
            isBundle: true,
            bundleItems: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!existingLine) {
      throw new Error('Order line not found');
    }

    const isLimited = existingLine.saleOrder.fulfillmentMode === 'LIMITED';
    const oldQuantity = existingLine.quantity;
    const newQuantity = quantity ?? oldQuantity;
    const quantityDiff = newQuantity - oldQuantity;

    let newCogs = existingLine.cogs ?? 0;

    // Handle inventory adjustments for LIMITED orders
    if (isLimited && quantityDiff !== 0) {
      if (quantityDiff > 0) {
        // Increasing quantity - deduct more inventory
        const additionalQty = quantityDiff;

        if (existingLine.product.isBundle && existingLine.product.bundleItems.length > 0) {
          // Handle bundle
          for (const bundleItem of existingLine.product.bundleItems) {
            const totalNeeded = additionalQty * bundleItem.quantity;

            // Check availability
            if (bundleItem.product.quantity < totalNeeded) {
              throw new Error(
                `Insufficient inventory for ${bundleItem.product.name} in bundle`
              );
            }

            const lots = await tx.inventoryLot.findMany({
              where: { productId: bundleItem.productId, quantity: { gt: 0 } },
              orderBy: { createdAt: 'asc' },
            });

            let remaining = totalNeeded;
            for (const lot of lots) {
              if (remaining === 0) break;
              const deduct = Math.min(lot.quantity, remaining);
              newCogs += deduct * lot.cost;
              remaining -= deduct;

              await tx.inventoryLot.update({
                where: { id: lot.id },
                data: { quantity: { decrement: deduct } },
              });
            }

            if (remaining > 0) {
              newCogs += remaining * (bundleItem.product.cost ?? 0);
            }

            await tx.product.update({
              where: { id: bundleItem.productId },
              data: { quantity: { decrement: totalNeeded } },
            });
          }
        } else {
          // Handle regular product
          if (existingLine.product.quantity < additionalQty) {
            throw new Error(
              `Insufficient inventory. Available: ${existingLine.product.quantity}`
            );
          }

          const lots = await tx.inventoryLot.findMany({
            where: { productId: existingLine.productId, quantity: { gt: 0 } },
            orderBy: { createdAt: 'asc' },
          });

          let remaining = additionalQty;
          for (const lot of lots) {
            if (remaining === 0) break;
            const deduct = Math.min(lot.quantity, remaining);
            newCogs += deduct * lot.cost;
            remaining -= deduct;

            await tx.inventoryLot.update({
              where: { id: lot.id },
              data: { quantity: { decrement: deduct } },
            });
          }

          if (remaining > 0) {
            newCogs += remaining * (existingLine.product.cost ?? 0);
          }

          await tx.product.update({
            where: { id: existingLine.productId },
            data: { quantity: { decrement: additionalQty } },
          });
        }
      } else {
        // Decreasing quantity - restore inventory
        const restoreQty = Math.abs(quantityDiff);

        if (existingLine.product.isBundle && existingLine.product.bundleItems.length > 0) {
          // Handle bundle restore
          for (const bundleItem of existingLine.product.bundleItems) {
            const totalRestore = restoreQty * bundleItem.quantity;
            const avgCost = bundleItem.product.cost ?? 0;

            await tx.inventoryLot.create({
              data: {
                productId: bundleItem.productId,
                quantity: totalRestore,
                cost: avgCost,
              },
            });

            await tx.product.update({
              where: { id: bundleItem.productId },
              data: { quantity: { increment: totalRestore } },
            });

            newCogs -= totalRestore * avgCost;
          }
        } else {
          // Handle regular product restore
          const avgCost = existingLine.product.cost ?? 0;

          await tx.inventoryLot.create({
            data: {
              productId: existingLine.productId,
              quantity: restoreQty,
              cost: avgCost,
            },
          });

          await tx.product.update({
            where: { id: existingLine.productId },
            data: { quantity: { increment: restoreQty } },
          });

          newCogs -= restoreQty * avgCost;
        }
      }
    }

    // If custom cost provided, override COGS
    if (customCost !== undefined) {
      newCogs = customCost * newQuantity;
    } else if (!isLimited) {
      // For ON_DEMAND, recalculate COGS with new quantity
      newCogs = (existingLine.product.cost ?? 0) * newQuantity;
    }

    // Update the line
    const newUnitPrice = unitPrice ?? existingLine.unitPrice;
    const newLineTotal = newUnitPrice * newQuantity;

    const updatedLine = await tx.saleOrderLine.update({
      where: { id: lineId },
      data: {
        quantity: newQuantity,
        unitPrice: newUnitPrice,
        lineTotal: newLineTotal,
        cogs: newCogs,
      },
    });

    // Recalculate order totals
    await recalculateOrderTotals(tx, existingLine.saleOrder.id);

    return updatedLine;
  });

  await createAuditLog('EDIT_SALE', {
    action: 'UPDATE_LINE',
    lineId,
    data: validated,
  });

  const saleOrderId = result.saleOrderId;
  revalidatePath(`/sales/${saleOrderId}`);
  revalidatePath(`/sales/${saleOrderId}/edit`);
  revalidatePath('/sales');
  revalidatePath('/products');

  return { success: true };
}

export async function removeOrderLine(data: z.infer<typeof removeOrderLineSchema>) {
  const validated = removeOrderLineSchema.parse(data);
  const { lineId } = validated;

  const result = await prisma.$transaction(async (tx) => {
    // Get the line to remove
    const line = await tx.saleOrderLine.findUnique({
      where: { id: lineId },
      include: {
        saleOrder: {
          select: { fulfillmentMode: true, id: true },
        },
        product: {
          select: {
            id: true,
            cost: true,
            isBundle: true,
            bundleItems: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!line) {
      throw new Error('Order line not found');
    }

    // Check if this is the only line
    const lineCount = await tx.saleOrderLine.count({
      where: { saleOrderId: line.saleOrderId },
    });

    if (lineCount <= 1) {
      throw new Error('Cannot remove the last line item from an order');
    }

    const isLimited = line.saleOrder.fulfillmentMode === 'LIMITED';

    // Restore inventory for LIMITED orders
    if (isLimited) {
      if (line.product.isBundle && line.product.bundleItems.length > 0) {
        // Restore bundle components
        for (const bundleItem of line.product.bundleItems) {
          const restoreQty = line.quantity * bundleItem.quantity;
          const avgCost = bundleItem.product.cost ?? 0;

          await tx.inventoryLot.create({
            data: {
              productId: bundleItem.productId,
              quantity: restoreQty,
              cost: avgCost,
            },
          });

          await tx.product.update({
            where: { id: bundleItem.productId },
            data: { quantity: { increment: restoreQty } },
          });
        }
      } else {
        // Restore regular product
        const avgCost = line.product.cost ?? 0;

        await tx.inventoryLot.create({
          data: {
            productId: line.productId,
            quantity: line.quantity,
            cost: avgCost,
          },
        });

        await tx.product.update({
          where: { id: line.productId },
          data: { quantity: { increment: line.quantity } },
        });
      }
    }

    // Delete the line
    await tx.saleOrderLine.delete({
      where: { id: lineId },
    });

    // Recalculate order totals
    await recalculateOrderTotals(tx, line.saleOrderId);

    return { saleOrderId: line.saleOrderId };
  });

  await createAuditLog('EDIT_SALE', {
    action: 'REMOVE_LINE',
    lineId,
  });

  revalidatePath(`/sales/${result.saleOrderId}`);
  revalidatePath(`/sales/${result.saleOrderId}/edit`);
  revalidatePath('/sales');
  revalidatePath('/products');

  return { success: true };
}

// ============================================================================
// ORDER EXPENSE ACTIONS
// ============================================================================

export async function addOrderExpense(data: z.infer<typeof addOrderExpenseSchema>) {
  const validated = addOrderExpenseSchema.parse(data);

  const expense = await prisma.orderExpense.create({
    data: validated,
  });

  await prisma.$transaction(async (tx) => {
    await recalculateOrderTotals(tx, validated.saleOrderId);
  });

  await createAuditLog('EDIT_SALE', {
    action: 'ADD_EXPENSE',
    saleOrderId: validated.saleOrderId,
    data: validated,
  });

  revalidatePath(`/sales/${validated.saleOrderId}`);
  revalidatePath(`/sales/${validated.saleOrderId}/edit`);

  return { success: true, expenseId: expense.id };
}

export async function removeOrderExpense(data: z.infer<typeof removeOrderExpenseSchema>) {
  const validated = removeOrderExpenseSchema.parse(data);

  const expense = await prisma.orderExpense.findUnique({
    where: { id: validated.expenseId },
    select: { saleOrderId: true },
  });

  if (!expense) {
    throw new Error('Expense not found');
  }

  await prisma.orderExpense.delete({
    where: { id: validated.expenseId },
  });

  await prisma.$transaction(async (tx) => {
    await recalculateOrderTotals(tx, expense.saleOrderId);
  });

  await createAuditLog('EDIT_SALE', {
    action: 'REMOVE_EXPENSE',
    expenseId: validated.expenseId,
  });

  revalidatePath(`/sales/${expense.saleOrderId}`);
  revalidatePath(`/sales/${expense.saleOrderId}/edit`);

  return { success: true };
}

// ============================================================================
// ORDER TOTALS & OVERRIDES
// ============================================================================

export async function updateOrderTotals(data: z.infer<typeof updateOrderTotalsSchema>) {
  const validated = updateOrderTotalsSchema.parse(data);
  const { saleOrderId, customCostOverride, customProfitOverride } = validated;

  await prisma.$transaction(async (tx) => {
    await tx.saleOrder.update({
      where: { id: saleOrderId },
      data: {
        customCostOverride,
        customProfitOverride,
      },
    });

    await recalculateOrderTotals(tx, saleOrderId);
  });

  await createAuditLog('EDIT_SALE', {
    action: 'UPDATE_OVERRIDES',
    saleOrderId,
    data: validated,
  });

  revalidatePath(`/sales/${saleOrderId}`);
  revalidatePath(`/sales/${saleOrderId}/edit`);

  return { success: true };
}

export async function updateOrderHeader(data: z.infer<typeof updateOrderHeaderSchema>) {
  const validated = updateOrderHeaderSchema.parse(data);
  const { saleOrderId, customerName, contactNumber, address, deliveryFee, notes } = validated;

  await prisma.$transaction(async (tx) => {
    const order = await tx.saleOrder.findUnique({
      where: { id: saleOrderId },
      select: {
        customerId: true,
        shippingAddress: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Update customer if name or phone changed
    if (customerName || contactNumber || address) {
      const customer = await tx.customer.findUnique({
        where: { id: order.customerId },
      });

      if (customer) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            ...(customerName && { name: customerName }),
            ...(address && { addressLine1: address }),
          },
        });
      }
    }

    // Update shipping address JSON
    const currentShipping = order.shippingAddress as Record<string, any>;
    const updatedShipping = {
      ...currentShipping,
      ...(contactNumber && { contactNumber }),
      ...(address && { address }),
      ...(deliveryFee !== undefined && { deliveryFee }),
      ...(notes !== undefined && { notes }),
    };

    await tx.saleOrder.update({
      where: { id: saleOrderId },
      data: {
        shippingAddress: updatedShipping,
      },
    });

    // Recalculate totals if delivery fee changed
    if (deliveryFee !== undefined) {
      await recalculateOrderTotals(tx, saleOrderId);
    }
  });

  await createAuditLog('EDIT_SALE', {
    action: 'UPDATE_HEADER',
    saleOrderId,
    data: validated,
  });

  revalidatePath(`/sales/${saleOrderId}`);
  revalidatePath(`/sales/${saleOrderId}/edit`);

  return { success: true };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function recalculateOrderTotals(
  tx: any,
  saleOrderId: string
) {
  const order = await tx.saleOrder.findUnique({
    where: { id: saleOrderId },
    include: {
      lines: true,
      orderExpenses: true,
    },
  });

  if (!order) return;

  // Calculate subtotal from lines
  const subtotal = order.lines.reduce(
    (sum: number, line: any) => sum + (line.lineTotal ?? 0),
    0
  );

  // Calculate total expenses
  const expensesTotal = order.orderExpenses.reduce(
    (sum: number, exp: any) => sum + (exp.amount ?? 0),
    0
  );

  // Get delivery fee from shipping address
  const shipping = order.shippingAddress as Record<string, any>;
  const deliveryFee = shipping?.deliveryFee ?? 0;

  // Total = subtotal + delivery fee + order expenses
  const total = subtotal + deliveryFee + expensesTotal;

  await tx.saleOrder.update({
    where: { id: saleOrderId },
    data: {
      subtotal,
      total,
    },
  });
}
