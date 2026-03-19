import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    auth: z.string().min(1),
    p256dh: z.string().min(1),
  }),
  deviceName: z.string().optional(),
  deviceType: z.enum(['mobile', 'desktop', 'tablet']).optional(),
  userAgent: z.string().optional(),
});

/**
 * POST /api/push/subscribe
 * Subscribe a device to push notifications
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = subscribeSchema.parse(body);

    // Use raw query to bypass Prisma Client validation issues
    // We generate a CUID-like ID if needed, but for raw insert we can just let DB handle it if we had a default, 
    // but since we need to provide all values:
    const { endpoint, keys, deviceName, deviceType, userAgent } = validatedData;
    
    // Generate a simple ID if creating new
    const newId = crypto.randomUUID();

    await prisma.$executeRaw`
      INSERT INTO "PushSubscription" (
        "id", "endpoint", "auth", "p256dh", 
        "deviceName", "deviceType", "userAgent", 
        "lastSeen", "createdAt", "updatedAt"
      ) VALUES (
        ${newId}, ${endpoint}, ${keys.auth}, ${keys.p256dh},
        ${deviceName || null}, ${deviceType || null}, ${userAgent || null},
        NOW(), NOW(), NOW()
      )
      ON CONFLICT ("endpoint") DO UPDATE SET
        "auth" = ${keys.auth},
        "p256dh" = ${keys.p256dh},
        "deviceName" = ${deviceName || null},
        "deviceType" = ${deviceType || null},
        "userAgent" = ${userAgent || null},
        "lastSeen" = NOW(),
        "updatedAt" = NOW()
    `;

    console.log(
      '[Push] Subscription saved:',
      validatedData.endpoint.substring(0, 30)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Push] Subscription error:', error); 

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid subscription data', details: error},
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}
