import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DIRECT_URL or DATABASE_URL must be defined in environment variables')
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding Controlplane demo data...')

  const username = process.env.DEMO_ADMIN_USERNAME ?? 'demo'
  const email = process.env.DEMO_ADMIN_EMAIL ?? 'demo@controlplane.local'
  const rawPassword = process.env.DEMO_ADMIN_PASSWORD ?? 'controlplane-demo'
  const password = await bcrypt.hash(rawPassword, 10)

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      email,
      name: 'Demo Operator',
      password,
    },
    create: {
      email,
      username,
      name: 'Demo Operator',
      password,
      role: 'OWNER',
    },
  })

  await prisma.appSettings.upsert({
    where: { id: 'singleton' },
    update: {
      language: 'en',
      phoneFormat: 'international',
      timezone: 'Asia/Amman',
      brandColor: '#dbec0a',
      emailNotifications: true,
      smsNotifications: false,
    },
    create: {
      id: 'singleton',
      language: 'en',
      phoneFormat: 'international',
      timezone: 'Asia/Amman',
      brandColor: '#dbec0a',
      emailNotifications: true,
      smsNotifications: false,
    },
  })

  console.log(`Created demo user: ${user.username} (${user.email})`)
  console.log(`Demo password: ${rawPassword}`)
  console.log('Seeding complete.')
}

main()
  .catch((error) => {
    console.error('Seeding failed:')
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
