'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationControlsProps {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalPages: number;
  className?: string;
}

export function PaginationControls({
  hasNextPage,
  hasPrevPage,
  totalPages,
  className,
}: PaginationControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = searchParams.get('page') ?? '1';
  const currentPage = Number(page);

  const handleNavigation = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  return (
    <div className={cn('flex items-center justify-center gap-4 py-4', className)}>
      <Button
        variant="outline"
        size="sm"
        disabled={!hasPrevPage}
        onClick={() => handleNavigation(currentPage - 1)}
        className="glass-panel border-white/10 bg-black/20 hover:bg-white/10 hover:text-primary transition-colors"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>

      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span className="text-foreground">{currentPage}</span>
        <span className="text-white/20">/</span>
        <span>{totalPages}</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={!hasNextPage}
        onClick={() => handleNavigation(currentPage + 1)}
        className="glass-panel border-white/10 bg-black/20 hover:bg-white/10 hover:text-primary transition-colors"
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
