import type { NextAuthConfig } from 'next-auth'

function isPublicAssetRoute(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/assets/') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/sw.js' ||
    pathname === '/offline.html' ||
    pathname === '/controlplane-mark.svg' ||
    pathname.includes('favicon.ico')
  )
}

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLogin = nextUrl.pathname.startsWith('/login')
      
      // Allow public access to customer sale view (only /customer-details/[id] with CUID format)
      // CUID format: starts with 'c' followed by 24 alphanumeric characters
      const saleIdMatch = nextUrl.pathname.match(/^\/customer-details\/([a-z0-9]+)$/i)
      const isPublicSaleView = saleIdMatch && saleIdMatch[1].length === 25 && saleIdMatch[1].startsWith('c')
      
      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl))
        return true
      }
      
      // Allow public access to customer sale view
      if (isPublicSaleView) {
        return true
      }
      
      // Allow access to auth endpoints and public assets.
      if (
        nextUrl.pathname.startsWith('/api/auth') ||
        isPublicAssetRoute(nextUrl.pathname)
      ) {
        return true
      }

      if (!isLoggedIn) {
        return false // Redirect to login
      }
      
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
  providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig
