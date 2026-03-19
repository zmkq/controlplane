import { getExpenses } from './actions';
import { ExpensesClient } from '@/components/expenses/expenses-client';
import { Trans } from '@/components/trans';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const { expenses, error } = await getExpenses();

  if (error || !expenses) {
    return (
      <div className="p-8 text-center text-destructive">
        <Trans k="expenses.errorLoading" fallback="Failed to load expenses. Please try again later." />
      </div>
    );
  }

  return (
    <main className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            <Trans k="expenses.title" fallback="Expenses" />
          </h2>
          <p className="text-muted-foreground">
            <Trans k="expenses.subtitle" fallback="Manage and track your business expenses." />
          </p>
        </div>
      </div>
      <ExpensesClient initialExpenses={expenses} />
    </main>
  );
}
