'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createExpense } from '@/app/expenses/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function ExpenseForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createExpense(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Expense added successfully');
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/dashboard" className="p-2 rounded-full hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add New Expense</h1>
          <p className="text-sm text-muted-foreground">Record a new business expense</p>
        </div>
      </div>

      <form action={onSubmit} className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/10">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category" required defaultValue="MISC">
            <SelectTrigger className="bg-black/20 border-white/10">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="COURIER_FEE">Courier Fee</SelectItem>
              <SelectItem value="PAYMENT_FEE">Payment Fee</SelectItem>
              <SelectItem value="MARKETING">Marketing</SelectItem>
              <SelectItem value="REFUND">Refund</SelectItem>
              <SelectItem value="MISC">Miscellaneous</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (JOD)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required
              className="bg-black/20 border-white/10"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={new Date().toISOString().split('T')[0]}
              className="bg-black/20 border-white/10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vendor">Vendor / Payee (Optional)</Label>
          <Input
            id="vendor"
            name="vendor"
            className="bg-black/20 border-white/10"
            placeholder="e.g. Facebook Ads, Aramex"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            name="notes"
            className="bg-black/20 border-white/10 min-h-[100px]"
            placeholder="Additional details..."
          />
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button variant="ghost" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="brand-glow">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Expense
          </Button>
        </div>
      </form>
    </div>
  );
}
