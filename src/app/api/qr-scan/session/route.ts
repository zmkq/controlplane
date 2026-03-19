import { NextResponse } from 'next/server';
import { createScanSession } from '@/lib/qr-scan';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSessionSchema = z.object({
  deviceId: z.string().min(1),
});

/**
 * POST /api/qr-scan/session
 * Create a new QR scan session and notify the device
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { deviceId } = createSessionSchema.parse(body);

    // Verify device exists
    const device = await prisma.pushSubscription.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    // Create session
    const session = await createScanSession(deviceId);

    // Send push notification to device
    const { broadcastPushNotification } = await import('@/lib/push');
    await broadcastPushNotification({
      title: 'Scan QR Code',
      body: 'Tap to open camera and scan product barcode',
      url: `/scan?sessionId=${session.id}`,
      requireInteraction: true,
      tag: `qr-scan-${session.id}`,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error('[QR Scan] Session creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create scan session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/qr-scan/session?sessionId=xxx
 * Get session status
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const { getScanSession } = await import('@/lib/qr-scan');
    const session = await getScanSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: session.id,
      status: session.status,
      scannedValue: session.scannedValue,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error('[QR Scan] Session fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
