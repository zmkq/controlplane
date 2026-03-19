import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { Client } from 'pg'
import { from as copyFrom } from 'pg-copy-streams'

const connectionString =
  process.env.SUPABASE_DATABASE_URL ||
  process.env.TARGET_DATABASE_URL ||
  process.env.DATABASE_URL

if (!connectionString) {
  console.error(
    'Missing target connection string. Set SUPABASE_DATABASE_URL (preferred), TARGET_DATABASE_URL, or DATABASE_URL.'
  )
  process.exit(1)
}

const importDir = process.env.IMPORT_DIR || path.resolve(process.cwd(), 'exports')

// Import order respects FK dependencies.
const tables = [
  'User',
  'AppSettings',
  'Supplier',
  'Product',
  'BundleItem',
  'Customer',
  'SaleOrder',
  'SaleOrderLine',
  'InventoryLot',
  'SupplierProduct',
  'PricingRule',
  'SupplierPO',
  'SupplierPOLine',
  'CourierBooking',
  'Refund',
  'Expense',
  'PeriodClose',
  'OwnerStatement',
  'Notification',
  'AuditLog',
  'AlertRule',
  'AlertEvent',
  'PushSubscription',
]

function ensureFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing CSV file: ${filePath}`)
  }
}

async function importTable(client: Client, table: string) {
  const filePath = path.join(importDir, `${table}.csv`)
  ensureFile(filePath)
  const copyQuery = `COPY "${table}" FROM STDIN WITH CSV HEADER`

  await new Promise<void>((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath)
    const stream = client.query(copyFrom(copyQuery))

    stream.on('error', reject)
    fileStream.on('error', reject)
    stream.on('finish', resolve)

    fileStream.pipe(stream)
  })

  console.log(`✔ Imported ${table} <- ${filePath}`)
}

async function main() {
  const client = new Client({ connectionString })

  try {
    await client.connect()
    for (const table of tables) {
      await importTable(client, table)
    }
  } finally {
    await client.end()
  }

  console.log(`All imports completed from ${importDir}`)
}

main().catch((err) => {
  console.error('Import failed:', err)
  process.exit(1)
})
