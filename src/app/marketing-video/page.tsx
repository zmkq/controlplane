import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from '@/lib/app-config';

export const metadata: Metadata = {
  title: `${APP_NAME} Promo Reel`,
  description: `A short overview of ${APP_NAME} for supplement commerce operations.`,
};

const highlightCards = [
  {
    title: 'Bilingual command center',
    body: 'English and Arabic workflows with the right layout direction and app-first navigation.',
  },
  {
    title: 'Supplement operations focus',
    body: 'Live orders, limited-stock control, on-demand supplier routing, and courier-ready handoffs.',
  },
  {
    title: 'Release-ready foundation',
    body: 'Bun, Supabase, Prisma, PWA support, smoke checks, and open-source contributor docs.',
  },
];

export default function MarketingVideoPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(98,195,255,0.18),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(219,236,10,0.14),transparent_34%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_35%,rgba(255,255,255,0.02))]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-10 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
              <Image
                src="/controlplane-mark.svg"
                alt={`${APP_NAME} mark`}
                width={28}
                height={28}
                className="h-7 w-7"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">
                Controlplane
              </p>
              <h1 className="text-lg font-semibold">{APP_TAGLINE}</h1>
            </div>
          </div>

          <Link
            href="/login"
            className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
          >
            Open dashboard
          </Link>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.5em] text-primary/80">
              Promo Reel
            </p>
            <div className="space-y-4">
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {APP_NAME} for supplement commerce operations.
              </h2>
              <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                {APP_DESCRIPTION} This page is the public reel companion for the
                open-source release and mirrors the product story used in the
                README, screenshots, and internship submission.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {highlightCards.map((card) => (
                <article
                  key={card.title}
                  className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
                >
                  <p className="text-sm font-semibold text-white">{card.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {card.body}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/80">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                    Release asset
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    Controlplane promo poster
                  </p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  OSS ready
                </span>
              </div>

              <div className="relative aspect-[16/10] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(98,195,255,0.22),transparent_38%),linear-gradient(160deg,#07111f,#04060d_60%,#0b1529)]">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
                <div className="relative flex h-full flex-col justify-between p-6">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/controlplane-mark.svg"
                      alt=""
                      width={30}
                      height={30}
                      className="h-8 w-8"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">{APP_NAME}</p>
                      <p className="text-xs text-slate-300">
                        English and Arabic operations dashboard
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.4em] text-cyan-200/70">
                      State of the art
                    </p>
                    <h3 className="max-w-sm text-3xl font-semibold tracking-tight text-white">
                      Manage stock, suppliers, sales, and reports from one glass cockpit.
                    </h3>
                    <p className="max-w-md text-sm leading-6 text-slate-300">
                      Release media can be swapped in without changing the route.
                      Until then, this poster frame keeps the public repo stable
                      and the build deterministic.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
