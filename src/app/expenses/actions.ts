'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const expenseSchema = z.object({
  category: z.enum(['COURIER_FEE', 'PAYMENT_FEE', 'MARKETING', 'REFUND', 'MISC']),
  amount: z.number().positive(),
  date: z.string().transform((str) => new Date(str)),
  vendor: z.string().optional(),
  notes: z.string().optional(),
});

export async function createExpense(formData: FormData) {
  const rawData = {
    category: formData.get('category'),
    amount: Number(formData.get('amount')),
    date: formData.get('date'),
    vendor: formData.get('vendor'),
    notes: formData.get('notes'),
  };

  const result = expenseSchema.safeParse(rawData);

  if (!result.success) {
    return { error: 'Invalid form data' };
  }

  const { category, amount, date, vendor, notes } = result.data;

  try {
    await prisma.expense.create({
      data: {
        category,
        amount,
        date,
        vendor,
        notes,
      },
    });
  } catch (error) {
    console.error('Failed to create expense:', error);
    return { error: 'Failed to create expense' };
  }

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function getExpenses() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: {
        date: 'desc',
      },
    });
    return { expenses };
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
    return { error: 'Failed to fetch expenses' };
  }
}

export async function deleteExpense(id: string) {
  try {
    await prisma.expense.delete({
      where: { id },
    });
    revalidatePath('/expenses');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete expense:', error);
    return { error: 'Failed to delete expense' };
  }
}
