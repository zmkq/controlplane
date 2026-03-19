'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  Trash2,
  Truck,
  CreditCard,
  Megaphone,
  RotateCcw,
  MoreHorizontal,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { deleteExpense } from '@/app/expenses/actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';

type Expense = {
  id: string;
  category: 'COURIER_FEE' | 'PAYMENT_FEE' | 'MARKETING' | 'REFUND' | 'MISC';
  amount: number;
  date: Date;
  vendor: string | null;
  notes: string | null;
};

const CATEGORY_ICONS = {
  COURIER_FEE: Truck,
  PAYMENT_FEE: CreditCard,
  MARKETING: Megaphone,
  REFUND: RotateCcw,
  MISC: MoreHorizontal,
};

const CATEGORY_LABELS = {
  COURIER_FEE: 'Courier Fee',
  PAYMENT_FEE: 'Payment Fee',
  MARKETING: 'Marketing',
  REFUND: 'Refund',
  MISC: 'Miscellaneous',
};

const CATEGORY_COLORS = {
  COURIER_FEE: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  PAYMENT_FEE: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  MARKETING: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  REFUND: 'text-red-400 bg-red-400/10 border-red-400/20',
  MISC: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
};

export function ExpensesClient({
  initialExpenses,
}: {
  initialExpenses: Expense[];
}) {
  const { t } = useTranslations();
  const router = useRouter();
  const [expenses, setExpenses] = useState(initialExpenses);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch =
        expense.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === 'ALL' || expense.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, categoryFilter]);

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        t(
          'expenses.confirmDelete',
          'Are you sure you want to delete this expense?',
        ),
      )
    )
      return;

    const toastId = toast.loading(
      t('expenses.deleting', 'Deleting expense...'),
    );
    const result = await deleteExpense(id);

    if (result.success) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success(t('expenses.deleted', 'Expense deleted'), { id: toastId });
      router.refresh();
    } else {
      toast.error(t('expenses.deleteFail', 'Failed to delete expense'), {
        id: toastId,
      });
    }
  };

  const totalAmount = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses],
  );

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:min-w-[300px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t(
                'expenses.searchPlaceholder',
                'Search expenses...',
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder={t('expenses.category', 'Category')} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                {t('expenses.allCategories', 'All Categories')}
              </SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {t(`expenses.categories.${key}`, label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => router.push('/expenses/new')}
          className="brand-glow">
          <Plus className="mr-2 h-4 w-4" />
          {t('expenses.addButton', 'Add Expense')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('expenses.totalExpenses', 'Total Expenses')}
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'JOD',
            }).format(totalAmount)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {t('expenses.transactionCount', 'Transaction Count')}
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {filteredExpenses.length}
          </p>
        </div>
      </div>

      {/* Expenses List */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/5 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">
                  {t('expenses.table.category', 'Category')}
                </th>
                <th className="px-6 py-4 font-medium">
                  {t('expenses.table.date', 'Date')}
                </th>
                <th className="px-6 py-4 font-medium">
                  {t('expenses.table.vendorNotes', 'Vendor / Notes')}
                </th>
                <th className="px-6 py-4 font-medium text-right">
                  {t('expenses.table.amount', 'Amount')}
                </th>
                <th className="px-6 py-4 font-medium text-right">
                  {t('expenses.table.actions', 'Actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-muted-foreground">
                    {t(
                      'expenses.noResults',
                      'No expenses found matching your criteria.',
                    )}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => {
                  const Icon = CATEGORY_ICONS[expense.category];
                  const colorClass = CATEGORY_COLORS[expense.category];

                  return (
                    <tr
                      key={expense.id}
                      className="group transition-colors hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-lg border',
                              colorClass,
                            )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className="font-medium text-foreground">
                            {t(
                              `expenses.categories.${expense.category}`,
                              CATEGORY_LABELS[expense.category],
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {format(new Date(expense.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-foreground font-medium">
                            {expense.vendor || '-'}
                          </span>
                          {expense.notes && (
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {expense.notes}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-medium text-foreground">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'JOD',
                        }).format(expense.amount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(expense.id)}
                          className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
