import JSZip from 'jszip';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toCsv } from '@/lib/csv';

export const dynamic = 'force-dynamic';

function getExportFileName(date: Date) {
  return `controlplane-export-${date.toISOString().slice(0, 10)}.zip`;
}

export async function GET() {
  const exportedAt = new Date();

  const [settings, products, suppliers, sales, expenses, notifications] =
    await Promise.all([
      prisma.appSettings.findMany({
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.product.findMany({
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.supplier.findMany({
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.saleOrder.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
          customer: true,
          partner: true,
          lines: true,
        },
      }),
      prisma.expense.findMany({
        orderBy: { date: 'desc' },
      }),
      prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          saleOrder: {
            include: {
              customer: true,
            },
          },
        },
      }),
    ]);

  const zip = new JSZip();

  zip.file(
    'manifest.json',
    JSON.stringify(
      {
        exportedAt: exportedAt.toISOString(),
        counts: {
          settings: settings.length,
          products: products.length,
          suppliers: suppliers.length,
          sales: sales.length,
          expenses: expenses.length,
          notifications: notifications.length,
        },
      },
      null,
      2,
    ),
  );

  zip.file(
    'settings.csv',
    toCsv(
      settings.map((setting) => ({
        id: setting.id,
        language: setting.language,
        phoneFormat: setting.phoneFormat,
        timezone: setting.timezone,
        brandColor: setting.brandColor,
        emailNotifications: setting.emailNotifications,
        smsNotifications: setting.smsNotifications,
        updatedAt: setting.updatedAt,
      })),
      [
        'id',
        'language',
        'phoneFormat',
        'timezone',
        'brandColor',
        'emailNotifications',
        'smsNotifications',
        'updatedAt',
      ],
    ),
  );

  zip.file(
    'products.csv',
    toCsv(
      products.map((product) => ({
        sku: product.sku,
        brand: product.brand,
        name: product.name,
        type: product.type,
        quantity: product.quantity,
        cost: product.cost,
        price: product.price,
        active: product.active,
        updatedAt: product.updatedAt,
      })),
      [
        'sku',
        'brand',
        'name',
        'type',
        'quantity',
        'cost',
        'price',
        'active',
        'updatedAt',
      ],
    ),
  );

  zip.file(
    'suppliers.csv',
    toCsv(
      suppliers.map((supplier) => ({
        id: supplier.id,
        name: supplier.name,
        contactName: supplier.contactName,
        contactPhone: supplier.contactPhone,
        contactEmail: supplier.contactEmail,
        defaultLeadTimeDays: supplier.defaultLeadTimeDays,
        updatedAt: supplier.updatedAt,
      })),
      [
        'id',
        'name',
        'contactName',
        'contactPhone',
        'contactEmail',
        'defaultLeadTimeDays',
        'updatedAt',
      ],
    ),
  );

  zip.file(
    'sales.csv',
    toCsv(
      sales.map((sale) => ({
        orderNo: sale.orderNo,
        date: sale.date,
        status: sale.status,
        channel: sale.channel,
        fulfillmentMode: sale.fulfillmentMode,
        customerName: sale.customer.name,
        customerPhone: sale.customer.phone,
        partnerName: sale.partner?.name,
        lineCount: sale.lines.length,
        subtotal: sale.subtotal,
        shippingFee: sale.shippingFee,
        total: sale.total,
        updatedAt: sale.updatedAt,
      })),
      [
        'orderNo',
        'date',
        'status',
        'channel',
        'fulfillmentMode',
        'customerName',
        'customerPhone',
        'partnerName',
        'lineCount',
        'subtotal',
        'shippingFee',
        'total',
        'updatedAt',
      ],
    ),
  );

  zip.file(
    'expenses.csv',
    toCsv(
      expenses.map((expense) => ({
        id: expense.id,
        category: expense.category,
        amount: expense.amount,
        date: expense.date,
        vendor: expense.vendor,
        linkedTo: expense.linkedTo,
        notes: expense.notes,
      })),
      ['id', 'category', 'amount', 'date', 'vendor', 'linkedTo', 'notes'],
    ),
  );

  zip.file(
    'notifications.csv',
    toCsv(
      notifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        read: notification.read,
        createdAt: notification.createdAt,
        orderNo: notification.saleOrder?.orderNo,
        customerName: notification.saleOrder?.customer?.name,
      })),
      ['id', 'title', 'body', 'read', 'createdAt', 'orderNo', 'customerName'],
    ),
  );

  const archive = await zip.generateAsync({ type: 'uint8array' });

  return new NextResponse(Buffer.from(archive), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${getExportFileName(
        exportedAt,
      )}"`,
      'Cache-Control': 'no-store',
    },
  });
}
