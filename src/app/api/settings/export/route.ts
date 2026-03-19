import JSZip from 'jszip';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toCsv } from '@/lib/csv';
import {
  getExportDatasetLabels,
  getExportFileName,
  parseExportProfile,
} from '@/lib/settings-export';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const exportedAt = new Date();
  const profile = parseExportProfile(
    new URL(request.url).searchParams.get('profile'),
  );

  try {
    const includeFullDatasets = profile === 'full';

    const [
      settings,
      products,
      suppliers,
      customers,
      sales,
      expenses,
      notifications,
      auditLogs,
      pushSubscriptions,
    ] = await Promise.all([
      prisma.appSettings.findMany({
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.product.findMany({
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.supplier.findMany({
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.customer.findMany({
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
      includeFullDatasets
        ? prisma.auditLog.findMany({
            orderBy: { timestamp: 'desc' },
            include: {
              user: {
                select: {
                  name: true,
                  username: true,
                },
              },
            },
          })
        : Promise.resolve([]),
      includeFullDatasets
        ? prisma.pushSubscription.findMany({
            orderBy: { updatedAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    const zip = new JSZip();
    const datasetLabels = getExportDatasetLabels(profile);
    const counts = {
      settings: settings.length,
      products: products.length,
      suppliers: suppliers.length,
      customers: customers.length,
      sales: sales.length,
      expenses: expenses.length,
      notifications: notifications.length,
      ...(includeFullDatasets
        ? {
            auditLogs: auditLogs.length,
            pushSubscriptions: pushSubscriptions.length,
          }
        : {}),
    };

    zip.file(
      'manifest.json',
      JSON.stringify(
        {
          schemaVersion: 2,
          profile,
          exportedAt: exportedAt.toISOString(),
          datasets: datasetLabels,
          counts,
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
      'customers.csv',
      toCsv(
        customers.map((customer) => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          city: customer.city,
          country: customer.country,
          tags: customer.tags,
          updatedAt: customer.updatedAt,
        })),
        ['id', 'name', 'phone', 'email', 'city', 'country', 'tags', 'updatedAt'],
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

    if (includeFullDatasets) {
      zip.file(
        'audit-logs.csv',
        toCsv(
          auditLogs.map((auditLog) => ({
            id: auditLog.id,
            timestamp: auditLog.timestamp,
            action: auditLog.action,
            actor: auditLog.user?.name ?? auditLog.user?.username ?? 'Unknown',
            details: JSON.stringify(auditLog.details),
          })),
          ['id', 'timestamp', 'action', 'actor', 'details'],
        ),
      );

      zip.file(
        'push-subscriptions.csv',
        toCsv(
          pushSubscriptions.map((subscription) => ({
            id: subscription.id,
            endpoint: subscription.endpoint,
            deviceName: subscription.deviceName,
            deviceType: subscription.deviceType,
            userAgent: subscription.userAgent,
            lastSeen: subscription.lastSeen,
            createdAt: subscription.createdAt,
            updatedAt: subscription.updatedAt,
          })),
          [
            'id',
            'endpoint',
            'deviceName',
            'deviceType',
            'userAgent',
            'lastSeen',
            'createdAt',
            'updatedAt',
          ],
        ),
      );
    }

    const archive = await zip.generateAsync({ type: 'uint8array' });

    return new NextResponse(Buffer.from(archive), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${getExportFileName(
          exportedAt,
          profile,
        )}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[settings-export] Failed to build export:', error);

    return NextResponse.json(
      {
        error: 'Failed to build export archive',
        profile,
        exportedAt: exportedAt.toISOString(),
      },
      { status: 500 },
    );
  }
}
