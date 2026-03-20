import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type EmptyStatePanelProps = {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  highlights?: string[];
  className?: string;
  children?: React.ReactNode;
};

export function EmptyStatePanel({
  icon: Icon,
  eyebrow,
  title,
  description,
  highlights,
  className,
  children,
}: EmptyStatePanelProps) {
  return (
    <div
      className={cn(
        'glass-panel relative overflow-hidden rounded-[2rem] border border-dashed border-white/10 px-6 py-10 text-center sm:px-8 sm:py-12',
        className,
      )}>
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(219,236,10,0.18),transparent_70%)]" />
      <div className="absolute -left-16 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-accent/10 blur-[90px]" />
      <div className="absolute -right-16 top-10 h-28 w-28 rounded-full bg-primary/12 blur-[80px]" />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/15 blur-2xl" />
          <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.75rem] border border-white/10 bg-white/[0.06] shadow-[0_0_40px_rgba(219,236,10,0.08)]">
            <Icon className="h-8 w-8 text-primary" />
          </div>
        </div>
        {eyebrow && (
          <p className="mt-5 text-[0.65rem] font-bold uppercase tracking-[0.32em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h3 className="mt-3 text-xl font-semibold text-foreground sm:text-2xl">
          {title}
        </h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
        {highlights && highlights.length > 0 && (
          <div className="mt-5 flex max-w-xl flex-wrap justify-center gap-2">
            {highlights.map((highlight) => (
              <span
                key={highlight}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-foreground">
                {highlight}
              </span>
            ))}
          </div>
        )}
        {children && (
          <div className="mt-7 flex flex-wrap justify-center gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
