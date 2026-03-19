import type { NextAuthConfig } from 'next-auth'

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
      
      // Allow access to public assets and api
      if (nextUrl.pathname.startsWith('/api/auth') || 
          nextUrl.pathname.startsWith('/_next') || 
          nextUrl.pathname.startsWith('/static') ||
          nextUrl.pathname.includes('favicon.ico')) {
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
        // @ts-expect-error NextAuth beta types do not include custom role yet.
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        // @ts-expect-error NextAuth beta types do not include custom role yet.
        session.user.role = token.role as string
      }
      return session
    },
  },
  providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig
