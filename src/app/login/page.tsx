import Image from 'next/image'
import { LoginForm } from '@/components/auth/login-form'
import { LanguageSwitcher } from '@/components/language-switcher'
import { APP_DESCRIPTION, APP_LOGO_PATH, APP_NAME } from '@/lib/app-config'

const floatingParticles = [
  { left: '8%', delay: '0s', duration: '18s' },
  { left: '16%', delay: '3s', duration: '22s' },
  { left: '24%', delay: '1.5s', duration: '20s' },
  { left: '33%', delay: '5s', duration: '19s' },
  { left: '42%', delay: '2s', duration: '21s' },
  { left: '50%', delay: '6s', duration: '17s' },
  { left: '61%', delay: '4s', duration: '23s' },
  { left: '70%', delay: '0.5s', duration: '20s' },
  { left: '79%', delay: '7s', duration: '18s' },
  { left: '88%', delay: '2.5s', duration: '24s' },
]

export default function LoginPage() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center relative overflow-hidden">
      <div className="absolute right-4 top-4 z-20">
        <LanguageSwitcher />
      </div>
      
      {/* ===== ANIMATED BACKGROUND ===== */}
      
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0015] via-[#0d0d1a] to-[#030308]" />
      
      {/* Large animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary Yellow-Green Orb */}
        <div 
          className="absolute w-[800px] h-[800px] rounded-full opacity-30 blur-[120px] animate-[float_20s_ease-in-out_infinite]"
          style={{
            background: 'radial-gradient(circle, #dbec0a 0%, transparent 70%)',
            top: '-20%',
            left: '-10%',
          }}
        />
        
        {/* Cyan/Blue Orb */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full opacity-25 blur-[100px] animate-[float_15s_ease-in-out_infinite_reverse]"
          style={{
            background: 'radial-gradient(circle, #00d4ff 0%, transparent 70%)',
            bottom: '-15%',
            right: '-5%',
          }}
        />
        
        {/* Purple/Magenta Orb */}
        <div 
          className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[80px] animate-[float_18s_ease-in-out_infinite_2s]"
          style={{
            background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)',
            top: '40%',
            right: '20%',
          }}
        />
        
        {/* Hot Pink Orb */}
        <div 
          className="absolute w-[400px] h-[400px] rounded-full opacity-20 blur-[90px] animate-[float_12s_ease-in-out_infinite_1s]"
          style={{
            background: 'radial-gradient(circle, #ec4899 0%, transparent 70%)',
            bottom: '20%',
            left: '10%',
          }}
        />
      </div>

      {/* Animated mesh gradient overlay */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            radial-gradient(at 40% 20%, rgba(219, 236, 10, 0.15) 0px, transparent 50%),
            radial-gradient(at 80% 0%, rgba(0, 212, 255, 0.1) 0px, transparent 50%),
            radial-gradient(at 0% 50%, rgba(168, 85, 247, 0.1) 0px, transparent 50%),
            radial-gradient(at 80% 50%, rgba(236, 72, 153, 0.08) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(0, 212, 255, 0.1) 0px, transparent 50%),
            radial-gradient(at 80% 100%, rgba(219, 236, 10, 0.1) 0px, transparent 50%)
          `,
        }}
      />

      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingParticles.map((particle, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-[rise_15s_linear_infinite]"
            style={{
              left: particle.left,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          />
        ))}
      </div>

      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc1IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]" />

      {/* ===== CONTENT ===== */}
      <div className="relative z-10 grid w-full max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <section className="hidden lg:flex flex-col justify-between rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-2xl">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14">
                <div className="absolute inset-0 rounded-2xl bg-[#dbec0a]/30 blur-xl" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/40">
                  <Image src={APP_LOGO_PATH} alt={APP_NAME} width={40} height={40} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/80">
                  Open-source release
                </p>
                <h1 className="text-3xl font-bold text-white">{APP_NAME}</h1>
              </div>
            </div>

            <div className="space-y-4">
              <p className="max-w-xl text-5xl font-black tracking-tight text-white">
                Operations clarity for supplement teams moving fast.
              </p>
              <p className="max-w-xl text-base leading-7 text-white/65">
                {APP_DESCRIPTION}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FeatureCard
                title="Bilingual"
                body="English and Arabic flows with runtime direction switching."
              />
              <FeatureCard
                title="Mobile-aware"
                body="Fast data entry, installable PWA, notifications, and scanning."
              />
              <FeatureCard
                title="Operations-first"
                body="Inventory, orders, reports, agents, and profitability in one cockpit."
              />
            </div>
          </div>

          <div className="mt-10 grid gap-3 text-sm text-white/55 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary/75">
                Built for
              </p>
              <p className="mt-2 text-white/80">
                supplement commerce teams handling orders, delivery, and stock pressure.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary/75">
                Release quality
              </p>
              <p className="mt-2 text-white/80">
                Bun, Supabase, Prisma, PWA flows, and public open-source docs.
              </p>
            </div>
          </div>
        </section>

        <div className="relative mx-auto w-full max-w-[440px]">
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <div className="relative h-14 w-14">
              <div className="absolute inset-0 bg-[#dbec0a] blur-xl opacity-50 animate-pulse" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/40">
                <Image src={APP_LOGO_PATH} alt={APP_NAME} width={40} height={40} />
              </div>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">{APP_NAME}</span>
          </div>

          <p className="mb-6 text-center text-sm text-white/45 lg:hidden">
            Bilingual supplement operations dashboard for inventory, orders, delivery, and reporting.
          </p>

          {/* Glass Card */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#dbec0a]/20 via-[#00d4ff]/20 to-[#a855f7]/20 rounded-3xl blur-xl opacity-50" />
            <div className="relative backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-2xl p-8 shadow-2xl">
              <LoginForm />
            </div>
          </div>

          <p className="text-center text-white/20 text-xs mt-8 tracking-wider">
            {APP_NAME.toUpperCase()} · OPEN-SOURCE OPERATIONS DASHBOARD
          </p>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary/75">
        {title}
      </p>
      <p className="mt-3 text-sm leading-6 text-white/70">{body}</p>
    </div>
  )
}
