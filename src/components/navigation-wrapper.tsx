'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { MobileDock } from '@/components/mobile-dock'

const PUBLIC_ROUTES = ['/login', '/customer-details']

export function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route))

  if (isPublicRoute) {
    // No navigation for public routes like login
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main
        id="main-content"
        className="relative min-w-0 flex-1 overflow-x-clip pb-[calc(var(--mobile-dock-height)+1.5rem+var(--safe-bottom))] pt-[calc(var(--nav-height)+var(--safe-top)+1rem)] lg:pb-12 lg:pl-[calc(var(--sidebar-width)+1.5rem)] lg:pt-[calc(var(--nav-height)+var(--safe-top)+1.25rem)] xl:pl-[calc(var(--sidebar-width)+2rem)]"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(98,195,255,0.12),transparent_60%)] opacity-80" />
        <div className="pointer-events-none absolute right-0 top-32 h-56 w-56 rounded-full bg-primary/8 blur-[100px]" />
        <div className="page-shell relative z-10 w-full max-w-full overflow-x-hidden lg:px-0 lg:pr-8 lg:pt-4 xl:pr-10 xl:pt-6">
          {children}
        </div>
      </main>
      <MobileDock />
    </>
  )
}
