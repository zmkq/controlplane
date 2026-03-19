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
        className="min-w-0 flex-1 pb-[calc(104px+var(--safe-bottom))] pt-[calc(var(--nav-height)+var(--safe-top)+0.75rem)] lg:pl-[calc(var(--sidebar-width)+1.5rem)] xl:pl-[calc(var(--sidebar-width)+2rem)]"
      >
        <div className="page-shell w-full lg:px-0 lg:pr-8 lg:pt-4 xl:pr-10 xl:pt-6">
          {children}
        </div>
      </main>
      <MobileDock />
    </>
  )
}
