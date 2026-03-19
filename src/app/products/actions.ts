'use server';

import { ProductType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

const bundleItemSchema = z.object({
  productId: z.string().cuid('Select a valid bundle item'),
  quantity: z.number().int().positive('Bundle quantity must be at least 1'),
});

const upsertProductSchema = z
  .object({
    id: z.string().cuid().optional(),
    name: z.string().trim().min(1, 'Name is required'),
    brand: z.string().trim().min(1, 'Brand is required'),
    sku: z
      .string()
      .trim()
      .min(1, 'SKU is required')
      .transform((value) => value.toUpperCase()),
    flavor: z.string().trim().optional().default(''),
    size: z.string().trim().optional().default(''),
    quantity: z.number().int().nonnegative(),
    cost: z.number().nonnegative(),
    price: z.number().nonnegative().optional(),
    active: z.boolean().optional().default(true),
    fulfillmentMode: z.enum(['limited', 'on-demand']).default('limited'),
    imageUrl: z.string().url().optional().or(z.literal('')),
    isBundle: z.boolean().optional().default(false),
    bundleItems: z.array(bundleItemSchema).optional().default([]),
    supplierId: z.string().cuid().optional(),
    shakerCount: z.number().int().nonnegative().optional(),
    type: z.nativeEnum(ProductType).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isBundle && data.bundleItems.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['bundleItems'],
        message: 'Add at least one item to this bundle.',
      });
    }

    if (!data.isBundle && data.fulfillmentMode === 'on-demand' && !data.supplierId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['supplierId'],
        message: 'Select an agent for on-demand fulfillment.',
      });
    }

    const uniqueBundleIds = new Set(data.bundleItems.map((item) => item.productId));
    if (uniqueBundleIds.size !== data.bundleItems.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['bundleItems'],
        message: 'Bundle items must be unique.',
      });
    }
  });

const deleteProductSchema = z.object({
  id: z.string().cuid(),
});

const bulkUpdateProductsSchema = z.object({
  ids: z.array(z.string().cuid()).min(1, 'Select at least one product'),
  action: z.enum(['activate', 'deactivate', 'delete']),
});

type UpsertProductInput = z.infer<typeof upsertProductSchema>;
type BulkUpdateProductsInput = z.infer<typeof bulkUpdateProductsSchema>;

async function ensureValidBundleItems(
  bundleItems: UpsertProductInput['bundleItems'],
  productId?: string,
) {
  if (bundleItems.length === 0) {
    return;
  }

  if (productId && bundleItems.some((item) => item.productId === productId)) {
    throw new Error('A bundle cannot include itself.');
  }

  const productIds = bundleItems.map((item) => item.productId);
  const existingCount = await prisma.product.count({
    where: { id: { in: productIds } },
  });

  if (existingCount !== productIds.length) {
    throw new Error('One or more bundle items no longer exist.');
  }
}

async function ensureValidSupplier(supplierId?: string) {
  if (!supplierId) {
    return;
  }

  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
    select: { id: true },
  });

  if (!supplier) {
    throw new Error('Selected agent could not be found.');
  }
}

async function syncProductRelations(
  productId: string,
  input: Pick<UpsertProductInput, 'bundleItems' | 'cost' | 'fulfillmentMode' | 'isBundle' | 'supplierId'>,
) {
  await prisma.bundleItem.deleteMany({
    where: { bundleId: productId },
  });

  if (input.isBundle && input.bundleItems.length > 0) {
    await prisma.bundleItem.createMany({
      data: input.bundleItems.map((item) => ({
        bundleId: productId,
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
  }

  await prisma.supplierProduct.deleteMany({
    where: { productId },
  });

  if (input.fulfillmentMode === 'on-demand' && input.supplierId) {
    await prisma.supplierProduct.create({
      data: {
        productId,
        supplierId: input.supplierId,
        baseCost: input.cost,
      },
    });
  }
}

async function assertProductsCanBeDeleted(ids: string[]) {
  const [linkedLines, linkedBundles] = await Promise.all([
    prisma.saleOrderLine.findMany({
      where: { productId: { in: ids } },
      select: { product: { select: { name: true } } },
      distinct: ['productId'],
    }),
    prisma.bundleItem.findMany({
      where: { productId: { in: ids } },
      select: {
        product: { select: { name: true } },
        bundle: { select: { name: true } },
      },
      distinct: ['productId'],
    }),
  ]);

  if (linkedLines.length > 0) {
    throw new Error(
      `Cannot delete products used in orders: ${linkedLines
        .map((line) => line.product.name)
        .join(', ')}.`,
    );
  }

  if (linkedBundles.length > 0) {
    throw new Error(
      `Remove these products from bundles first: ${linkedBundles
        .map((item) => `${item.product.name} in ${item.bundle.name}`)
        .join(', ')}.`,
    );
  }
}

function revalidateProductSurfaces() {
  revalidatePath('/products');
  revalidatePath('/sales/new');
}

export async function upsertProduct(input: UpsertProductInput) {
  const data = upsertProductSchema.parse(input);
  const {
    id,
    fulfillmentMode,
    imageUrl,
    isBundle,
    bundleItems,
    supplierId,
    shakerCount,
    ...payload
  } = data;

  await Promise.all([
    isBundle ? ensureValidBundleItems(bundleItems, id) : Promise.resolve(),
    !isBundle && fulfillmentMode === 'on-demand'
      ? ensureValidSupplier(supplierId)
      : Promise.resolve(),
  ]);

  const attributesPayload = {
    fulfillmentMode,
    shakerCount: shakerCount ?? 0,
  };

  const product = id
    ? await prisma.product.update({
        where: { id },
        data: {
          ...payload,
          isBundle,
          quantity: fulfillmentMode === 'on-demand' || isBundle ? 0 : payload.quantity,
          attributes: attributesPayload,
          images: imageUrl || null,
        },
      })
    : await prisma.product.create({
        data: {
          ...payload,
          isBundle,
          quantity: fulfillmentMode === 'on-demand' || isBundle ? 0 : payload.quantity,
          attributes: attributesPayload,
          images: imageUrl || null,
        },
      });

  await syncProductRelations(product.id, {
    bundleItems,
    cost: payload.cost,
    fulfillmentMode,
    isBundle,
    supplierId,
  });

  await createAuditLog(id ? 'UPDATE_PRODUCT' : 'CREATE_PRODUCT', {
    productId: product.id,
    sku: product.sku,
    fulfillmentMode,
    isBundle,
    active: payload.active,
  });

  revalidateProductSurfaces();
}

export async function deleteProductAction(input: z.infer<typeof deleteProductSchema>) {
  const { id } = deleteProductSchema.parse(input);

  await assertProductsCanBeDeleted([id]);

  const deleted = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id },
      select: { id: true, name: true, sku: true },
    });

    if (!product) {
      throw new Error('Product not found.');
    }

    await tx.inventoryLot.deleteMany({
      where: { productId: id },
    });
    await tx.bundleItem.deleteMany({
      where: { bundleId: id },
    });
    await tx.supplierProduct.deleteMany({
      where: { productId: id },
    });
    await tx.product.delete({
      where: { id },
    });

    return product;
  });

  await createAuditLog('DELETE_PRODUCT', deleted);

  revalidateProductSurfaces();
}

export async function bulkUpdateProducts(input: BulkUpdateProductsInput) {
  const { ids, action } = bulkUpdateProductsSchema.parse(input);
  const uniqueIds = [...new Set(ids)];

  if (action === 'delete') {
    await assertProductsCanBeDeleted(uniqueIds);

    const deletedProducts = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true, name: true, sku: true },
      });

      await tx.inventoryLot.deleteMany({
        where: { productId: { in: uniqueIds } },
      });
      await tx.bundleItem.deleteMany({
        where: { bundleId: { in: uniqueIds } },
      });
      await tx.supplierProduct.deleteMany({
        where: { productId: { in: uniqueIds } },
      });
      await tx.product.deleteMany({
        where: { id: { in: uniqueIds } },
      });

      return products;
    });

    await createAuditLog('BULK_DELETE_PRODUCTS', {
      count: deletedProducts.length,
      ids: deletedProducts.map((product) => product.id),
      skus: deletedProducts.map((product) => product.sku),
    });

    revalidateProductSurfaces();
    return { count: deletedProducts.length };
  }

  const active = action === 'activate';
  const result = await prisma.product.updateMany({
    where: { id: { in: uniqueIds } },
    data: { active },
  });

  await createAuditLog('BULK_UPDATE_PRODUCTS', {
    count: result.count,
    ids: uniqueIds,
    active,
  });

  revalidateProductSurfaces();
  return { count: result.count };
}
