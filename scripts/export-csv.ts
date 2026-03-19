import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { Client } from 'pg'
import { to as copyTo } from 'pg-copy-streams'

const connectionString =
  process.env.SOURCE_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL

if (!connectionString) {
  console.error(
    'Missing connection string. Set SOURCE_DATABASE_URL (preferred), DATABASE_URL, or POSTGRES_URL.'
  )
  process.exit(1)
}

const exportDir = process.env.EXPORT_DIR || path.resolve(process.cwd(), 'exports')

// Update this list if new tables are added later.
const tables = [
  'User',
  'AuditLog',
  'Product',
  'BundleItem',
  'InventoryLot',
  'Supplier',
  'SupplierProduct',
  'PricingRule',
  'Customer',
  'SaleOrder',
  'SaleOrderLine',
  'SupplierPO',
  'SupplierPOLine',
  'CourierBooking',
  'Expense',
  'Refund',
  'PeriodClose',
  'OwnerStatement',
  'AlertRule',
  'AlertEvent',
  'Notification',
  'AppSettings',
  'PushSubscription',
]

async function exportTable(client: Client, table: string) {
  const filePath = path.join(exportDir, `${table}.csv`)
  const copyQuery = `COPY "${table}" TO STDOUT WITH CSV HEADER`

  await new Promise<void>((resolve, reject) => {
    const fileStream = fs.createWriteStream(filePath)
    const stream = client.query(copyTo(copyQuery))

    stream.on('error', reject)
    fileStream.on('error', reject)
    fileStream.on('finish', resolve)

    stream.pipe(fileStream)
  })

  console.log(`✔ Exported ${table} -> ${filePath}`)
}

async function main() {
  fs.mkdirSync(exportDir, { recursive: true })
  const client = new Client({ connectionString })

  try {
    await client.connect()
    for (const table of tables) {
      await exportTable(client, table)
    }
  } finally {
    await client.end()
  }

  console.log(`All exports completed. Files are in ${exportDir}`)
}

main().catch((err) => {
  console.error('Export failed:', err)
  process.exit(1)
})
