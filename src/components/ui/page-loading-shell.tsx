import { GlassSkeleton } from '@/components/ui/glass-skeleton';

type PageLoadingShellProps = {
  metrics?: number;
  items?: number;
  layout?: 'cards' | 'list';
};

export function PageLoadingShell({
  metrics = 3,
  items = 6,
  layout = 'cards',
}: PageLoadingShellProps) {
  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div className="space-y-3">
          <GlassSkeleton className="h-4 w-28 rounded-full" />
          <GlassSkeleton className="h-10 w-64" />
          <GlassSkeleton className="h-4 w-full max-w-2xl" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: metrics }).map((_, index) => (
            <GlassSkeleton
              key={index}
              className="h-32 rounded-[1.75rem] border border-white/5"
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <GlassSkeleton className="h-14 rounded-[1.5rem] border border-white/5" />
        <div
          className={
            layout === 'list'
              ? 'space-y-4'
              : 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'
          }>
          {Array.from({ length: items }).map((_, index) => (
            <GlassSkeleton
              key={index}
              className={
                layout === 'list'
                  ? 'h-28 rounded-[2rem] border border-white/5'
                  : 'h-72 rounded-[2rem] border border-white/5'
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}
