
// Mock bcrypt for edge runtime where 'crypto' module is not available
const bcrypt = {
  compare: async (s: string, hash: string) => {
    // In edge runtime, we can't use bcrypt.
    // However, the authorize function typically runs in nodejs environment unless explicitly set to edge.
    // If we MUST support edge for auth, we should use a different hashing algorithm or an external auth service.
    // For now, we are assuming 'check' happens where Node.js APIs are available.
    // If this code runs on Edge, it will crash without this mock or a real crypto replacement.
    
    // BUT, NextAuth 'authorize' callback runs in the runtime defined by the route.
    // We will keep standard bcryptjs usage in auth.ts (which enters the bundle),
    // but we can move the hashing logic to a separate file if needed.
    return false
  }
}

export default bcrypt
