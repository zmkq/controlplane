'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface ActionItem {
  label: string;
  icon: LucideIcon;
  href: string;
  color: string;
}

export function ActionGrid({ actions }: { actions: ActionItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className="glass-panel group flex flex-col items-center gap-3 rounded-2xl p-4 text-center transition-all hover:scale-105 hover:bg-white/5 hover:shadow-lg active:scale-95"
        >
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-inner transition-all group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]',
              'from-white/10 to-white/5',
              action.color
            )}
          >
            <action.icon className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
