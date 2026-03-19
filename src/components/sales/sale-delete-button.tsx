'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { deleteSale } from '@/app/sales/actions';
import { toast } from '@/lib/toast';

interface SaleDeleteButtonProps {
  saleId: string;
  variant?: 'ghost' | 'outline' | 'destructive';
  size?: 'sm' | 'default';
  redirectToList?: boolean;
  label?: string;
}

export function SaleDeleteButton({
  saleId,
  variant = 'ghost',
  size = 'sm',
  redirectToList = false,
  label = 'Remove',
}: SaleDeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (!confirm('Delete this order? This cannot be undone.')) {
      return;
    }
    startTransition(async () => {
      try {
        await deleteSale({ id: saleId });
        toast.success('Order deleted');
        router.push('/sales');
        router.refresh();
      } catch (error) {
        console.error('Failed to delete sale:', error);
        toast.error('Failed to delete order');
      }
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDelete}
      loading={isPending}
      className={variant === 'destructive' ? '' : 'text-destructive'}
    >
      {label}
    </Button>
  );
}
