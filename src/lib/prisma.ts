import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { env } from '@/lib/env'

const pool = new Pool({ 
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,                        // Increased from 5 to handle concurrent requests
  min: 2,                         // Keep 2 warm connections ready
  idleTimeoutMillis: 60000,       // 1 minute idle timeout (was 30s)
  connectionTimeoutMillis: 5000,  // 5s connection timeout (was 10s)
})
const adapter = new PrismaPg(pool)

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
