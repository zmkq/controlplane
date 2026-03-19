import { GlassSkeleton } from '@/components/ui/glass-skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="glass-panel rounded-[2rem] border border-white/5 bg-white/5 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap gap-2">
              <GlassSkeleton className="h-7 w-32 rounded-full" />
              <GlassSkeleton className="h-7 w-20 rounded-full" />
            </div>
            <GlassSkeleton className="h-10 w-full max-w-[20rem] rounded-2xl sm:max-w-[26rem]" />
            <GlassSkeleton className="h-4 w-[min(32rem,90vw)]" />
            <GlassSkeleton className="h-4 w-[min(24rem,80vw)]" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:w-[34rem]">
            {Array.from({ length: 3 }).map((_, i) => (
              <GlassSkeleton
                key={i}
                className="h-28 w-full rounded-[1.5rem]"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="glass-panel rounded-[2rem] border border-white/5 bg-white/5 px-6 py-6"
          >
            <GlassSkeleton className="h-4 w-24" />
            <GlassSkeleton className="mt-4 h-12 w-32 rounded-2xl" />
            <GlassSkeleton className="mt-3 h-3 w-20" />
          </div>
        ))}
      </section>

      <section className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="glass-panel rounded-[2rem] border border-white/5 bg-white/5 px-6 py-8"
          >
            <GlassSkeleton className="h-6 w-40 rounded-xl" />
            <GlassSkeleton className="mt-8 h-64 w-full rounded-xl" />
          </div>
        ))}
      </section>

      <section className="glass-panel rounded-[2rem] border border-white/5 bg-white/5 px-6 py-8">
        <GlassSkeleton className="h-6 w-32" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <GlassSkeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </section>
    </div>
  );
}

