import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type EmptyStatePanelProps = {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
};

export function EmptyStatePanel({
  icon: Icon,
  eyebrow,
  title,
  description,
  className,
  children,
}: EmptyStatePanelProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[2rem] border border-dashed border-white/10 bg-white/[0.04] px-6 py-10 text-center',
        className,
      )}>
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(219,236,10,0.12),transparent_70%)]" />
      <div className="relative mx-auto flex max-w-xl flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-[0_0_40px_rgba(219,236,10,0.08)]">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        {eyebrow && (
          <p className="mt-5 text-[0.65rem] font-bold uppercase tracking-[0.32em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h3 className="mt-3 text-xl font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
      </div>
    </div>
  );
}
