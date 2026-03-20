import { GlassSkeleton } from '@/components/ui/glass-skeleton';

type PageLoadingShellProps = {
  metrics?: number;
  items?: number;
  layout?: 'cards' | 'list';
  contextLabel?: string;
  accentLabel?: string;
  toolbarChips?: number;
};

export function PageLoadingShell({
  metrics = 3,
  items = 6,
  layout = 'cards',
  contextLabel = 'Syncing workspace',
  accentLabel = 'Loading live data',
  toolbarChips = 5,
}: PageLoadingShellProps) {
  return (
    <div className="space-y-8">
      <section className="glass-panel relative overflow-hidden rounded-[2rem] border border-white/5 px-5 py-5 sm:px-6 sm:py-6">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(98,195,255,0.14),transparent_60%)] lg:block" />
        <div className="absolute -left-16 top-12 h-32 w-32 rounded-full bg-primary/10 blur-[100px]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex h-7 items-center rounded-full border border-white/10 bg-white/5 px-3">
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  {contextLabel}
                </span>
              </div>
              <div className="inline-flex h-7 items-center rounded-full border border-primary/15 bg-primary/10 px-3">
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-primary">
                  {accentLabel}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <GlassSkeleton className="h-10 w-full max-w-[18rem] rounded-2xl sm:max-w-[24rem]" />
              <GlassSkeleton className="h-4 w-full max-w-2xl" />
              <GlassSkeleton className="h-4 w-full max-w-xl" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[1.35rem] border border-white/10 bg-black/20 p-3">
                  <GlassSkeleton className="h-3 w-20" />
                  <GlassSkeleton className="mt-3 h-6 w-24 rounded-xl" />
                  <GlassSkeleton className="mt-2 h-3 w-full max-w-[7rem]" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:w-[34rem]">
            {Array.from({ length: metrics }).map((_, index) => (
              <GlassSkeleton
                key={index}
                className="h-28 rounded-[1.5rem] border border-white/5"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <GlassSkeleton className="h-12 w-full rounded-[1.25rem] xl:max-w-md" />
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: toolbarChips }).map((_, index) => (
              <GlassSkeleton
                key={index}
                className="h-10 min-w-24 rounded-xl border border-white/5"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div
          className={
            layout === 'list'
              ? 'space-y-4'
              : 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'
          }>
          {Array.from({ length: items }).map((_, index) => (
            <div
              key={index}
              className={
                layout === 'list'
                  ? 'glass-panel rounded-[2rem] border border-white/5 p-4 sm:p-5'
                  : ''
              }>
              {layout === 'list' ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <GlassSkeleton className="h-12 w-12 rounded-2xl" />
                    <div className="space-y-3">
                      <GlassSkeleton className="h-4 w-28" />
                      <GlassSkeleton className="h-7 w-44 rounded-xl" />
                      <div className="flex gap-2">
                        <GlassSkeleton className="h-6 w-16 rounded-full" />
                        <GlassSkeleton className="h-6 w-20 rounded-full" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <GlassSkeleton className="h-7 w-28 rounded-full" />
                    <GlassSkeleton className="h-8 w-20 rounded-xl" />
                  </div>
                </div>
              ) : (
                <GlassSkeleton className="h-72 rounded-[2rem] border border-white/5" />
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
