import { NextResponse } from 'next/server';
import { updateScanSession, getScanSession } from '@/lib/qr-scan';
import { z } from 'zod';

const submitSchema = z.object({
  sessionId: z.string().min(1),
  value: z.string().min(1),
});

/**
 * POST /api/qr-scan/submit
 * Submit scanned QR code value
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, value } = submitSchema.parse(body);

    // Verify session exists and is valid
    const session = await getScanSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.status === 'EXPIRED') {
      return NextResponse.json(
        { error: 'Session has expired' },
        { status: 410 }
      );
    }

    if (session.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Session was cancelled' },
        { status: 410 }
      );
    }

    if (session.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Session already completed' },
        { status: 409 }
      );
    }

    // Update session with scanned value
    await updateScanSession(sessionId, 'COMPLETED', value);

    return NextResponse.json({
      success: true,
      message: 'Scan submitted successfully',
    });
  } catch (error) {
    console.error('[QR Scan] Submit error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit scan' },
      { status: 500 }
    );
  }
}
