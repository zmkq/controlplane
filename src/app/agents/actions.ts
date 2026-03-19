'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const upsertAgentSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().min(1, 'Name is required'),
  contactName: z.string().optional().default(''),
  contactPhone: z.string().optional().default(''),
  contactEmail: z.string().email().optional().or(z.literal('')).default(''),
  terms: z.string().optional().default(''),
  defaultLeadTimeDays: z.number().int().nonnegative().optional().default(24),
});

const deleteAgentSchema = z.object({
  id: z.string().cuid(),
});

export async function upsertAgent(input: z.infer<typeof upsertAgentSchema>) {
  const data = upsertAgentSchema.parse(input);
  const { id, ...payload } = data;

  if (id) {
    await prisma.supplier.update({
      where: { id },
      data: payload,
    });
  } else {
    await prisma.supplier.create({
      data: payload,
    });
  }

  revalidatePath('/agents');
  revalidatePath('/sales/new');
}

export async function deleteAgent(input: z.infer<typeof deleteAgentSchema>) {
  const { id } = deleteAgentSchema.parse(input);

  const hasProducts = await prisma.supplierProduct.count({ where: { supplierId: id } });
  if (hasProducts > 0) {
    throw new Error('Cannot delete agent while products are linked.');
  }

  await prisma.supplier.delete({ where: { id } });
  revalidatePath('/agents');
  revalidatePath('/sales/new');
}
