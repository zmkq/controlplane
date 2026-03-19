'use server';

import { ProductType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const upsertProductSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(1, 'Name is required'),
  brand: z.string().min(1, 'Brand is required'),
  sku: z.string().min(1, 'SKU is required'),
  flavor: z.string().optional().default(''),
  size: z.string().optional().default(''),
  quantity: z.number().int().nonnegative(),
  cost: z.number().nonnegative(),
  price: z.number().nonnegative().optional(),
  active: z.boolean().optional().default(true),
  fulfillmentMode: z.enum(['limited', 'on-demand']).default('limited'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isBundle: z.boolean().optional().default(false),
  bundleItems: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1)
  })).optional(),
  supplierId: z.string().optional(),
  shakerCount: z.number().optional(),
  type: z.nativeEnum(ProductType).optional(),
});

const deleteProductSchema = z.object({
  id: z.string().cuid(),
});

export async function upsertProduct(
  input: z.infer<typeof upsertProductSchema>
) {
  const data = upsertProductSchema.parse(input);
  const { id, fulfillmentMode, imageUrl, isBundle, bundleItems, supplierId, shakerCount, ...payload } = data;

  const attributesPayload = { 
    fulfillmentMode,
    shakerCount: shakerCount || 0 
  };

  if (id) {
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { attributes: true },
    });

    let mergedAttributes = attributesPayload;
    if (
      existing?.attributes &&
      typeof existing.attributes === 'object' &&
      !Array.isArray(existing.attributes)
    ) {
      mergedAttributes = {
        ...existing.attributes,
        fulfillmentMode,
        shakerCount: shakerCount !== undefined ? shakerCount : (existing.attributes as any).shakerCount
      };
    }

    await prisma.product.update({
      where: { id },
      data: {
        ...payload,
        isBundle: isBundle || false,
        quantity: fulfillmentMode === 'on-demand' || isBundle ? 0 : payload.quantity,
        attributes: mergedAttributes,
        images: imageUrl || null,
      },
    });

    // Handle Bundle Items
    if (isBundle && bundleItems) {
      // Delete existing items
      await prisma.bundleItem.deleteMany({ where: { bundleId: id } });
      // Create new items
      if (bundleItems.length > 0) {
        await prisma.bundleItem.createMany({
          data: bundleItems.map(item => ({
            bundleId: id,
            productId: item.productId,
            quantity: item.quantity
          }))
        });
      }
    }

    // Handle Supplier (Agent) for On-Demand
    if (fulfillmentMode === 'on-demand' && supplierId) {
      // Check if relation exists
      const existingRelation = await prisma.supplierProduct.findUnique({
        where: {
          productId_supplierId: {
            productId: id,
            supplierId
          }
        }
      });

      if (!existingRelation) {
        await prisma.supplierProduct.create({
          data: {
            productId: id,
            supplierId,
            baseCost: payload.cost
          }
        });
      } else {
        await prisma.supplierProduct.update({
          where: {
             productId_supplierId: {
              productId: id,
              supplierId
            }
          },
          data: {
            baseCost: payload.cost
          }
        });
      }
    }

  } else {
    const newProduct = await prisma.product.create({
      data: {
        ...payload,
        isBundle: isBundle || false,
        quantity: fulfillmentMode === 'on-demand' || isBundle ? 0 : payload.quantity,
        attributes: attributesPayload,
        images: imageUrl || null,
      },
    });

    // Handle Bundle Items
    if (isBundle && bundleItems && bundleItems.length > 0) {
      await prisma.bundleItem.createMany({
        data: bundleItems.map(item => ({
          bundleId: newProduct.id,
          productId: item.productId,
          quantity: item.quantity
        }))
      });
    }

    // Handle Supplier
    if (fulfillmentMode === 'on-demand' && supplierId) {
      await prisma.supplierProduct.create({
        data: {
          productId: newProduct.id,
          supplierId,
          baseCost: payload.cost
        }
      });
    }
  }

  revalidatePath('/products');
  revalidatePath('/sales/new');
}

export async function deleteProductAction(
  input: z.infer<typeof deleteProductSchema>
) {
  const { id } = deleteProductSchema.parse(input);

  const linkedLines = await prisma.saleOrderLine.count({
    where: { productId: id },
  });

  if (linkedLines > 0) {
    throw new Error(
      'This product is used in existing orders. Remove those orders first.'
    );
  }

  await prisma.product.delete({
    where: { id },
  });

  revalidatePath('/products');
  revalidatePath('/sales/new');
}
