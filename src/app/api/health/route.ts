import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { featureFlags } from '@/lib/env';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'ok',
      database: 'ok',
      features: {
        imageUpload: featureFlags.imageUpload,
        pushNotifications: featureFlags.pushNotifications,
      },
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[health] Health check failed:', error);

    return NextResponse.json(
      {
        status: 'degraded',
        database: 'error',
        features: {
          imageUpload: featureFlags.imageUpload,
          pushNotifications: featureFlags.pushNotifications,
        },
        checkedAt: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
