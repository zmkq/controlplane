import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

/**
 * POST /api/push/unsubscribe
 * Unsubscribe a device from push notifications
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = unsubscribeSchema.parse(body);

    // Use deleteMany to avoid error if subscription doesn't exist
    const result = await prisma.pushSubscription.deleteMany({
      where: { endpoint: validatedData.endpoint },
    });

    if (result.count > 0) {
      console.log('[Push] Subscription removed:', validatedData.endpoint.substring(0, 30));
    } else {
      console.log('[Push] Subscription not found (already removed):', validatedData.endpoint.substring(0, 30));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Push] Unsubscription error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid endpoint', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}

