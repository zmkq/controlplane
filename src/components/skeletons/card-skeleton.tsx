import { GlassSkeleton } from '@/components/ui/glass-skeleton';

interface CardSkeletonProps {
  count?: number;
  columns?: number;
}

export function CardSkeleton({ count = 6, columns = 3 }: CardSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <GlassSkeleton className="h-8 w-48" />
        <GlassSkeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Search */}
      <GlassSkeleton className="h-12 w-full rounded-xl" />

      {/* Cards Grid */}
      <div
        className={`grid gap-4 ${
          columns === 2
            ? 'sm:grid-cols-2'
            : columns === 3
            ? 'sm:grid-cols-2 lg:grid-cols-3'
            : 'sm:grid-cols-2 lg:grid-cols-4'
        }`}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="glass-panel rounded-[2rem] border border-white/5 bg-white/5 px-6 py-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-4">
                <GlassSkeleton className="h-6 w-3/4" />
                <GlassSkeleton className="h-4 w-1/2" />
                <GlassSkeleton className="h-4 w-2/3" />
              </div>
              <GlassSkeleton className="h-10 w-10 rounded-full" />
            </div>
            <div className="mt-6 flex gap-3">
              <GlassSkeleton className="h-10 flex-1 rounded-xl" />
              <GlassSkeleton className="h-10 w-10 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

