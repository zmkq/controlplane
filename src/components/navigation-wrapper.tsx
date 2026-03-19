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
        className="flex-1 pb-[calc(112px+var(--safe-bottom))] pt-[calc(var(--nav-height)+var(--safe-top))] lg:pl-72"
      >
        <div className="page-shell lg:pr-10 lg:pt-6">
          {children}
        </div>
      </main>
      <MobileDock />
    </>
  )
}
