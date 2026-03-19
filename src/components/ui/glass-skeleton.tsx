import { cn } from '@/lib/utils';

interface GlassSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function GlassSkeleton({ className, ...props }: GlassSkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-white/5',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent',
        className
      )}
      {...props}
    />
  );
}
