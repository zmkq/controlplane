'use client';

import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { useDebouncedCallback } from 'use-debounce';

interface SearchInputProps {
  placeholder?: string;
  className?: string;
}

export function SearchInput({ placeholder = 'Search...', className }: SearchInputProps) {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    // Reset page to 1 when searching
    params.set('page', '1');
    
    startTransition(() => {
      replace(`?${params.toString()}`);
    });
  }, 300);

  return (
    <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-2.5 transition-colors focus-within:border-primary/50 focus-within:bg-white/10">
      <Search className={`h-4 w-4 text-muted-foreground ${isPending ? 'animate-pulse text-primary' : ''}`} />
      <input
        type="text"
        placeholder={placeholder}
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get('q')?.toString()}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
      />
    </div>
  );
}
