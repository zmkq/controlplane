import { getScanSession } from '@/lib/qr-scan';

/**
 * GET /api/qr-scan/stream?sessionId=xxx
 * Server-Sent Events endpoint for real-time session updates
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return new Response('sessionId is required', { status: 400 });
  }

  // Verify session exists
  const session = await getScanSession(sessionId);
  if (!session) {
    return new Response('Session not found', { status: 404 });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      );

      // Poll for session updates every 500ms
      intervalId = setInterval(async () => {
        try {
          const currentSession = await getScanSession(sessionId);

          if (!currentSession) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'error', message: 'Session not found' })}\n\n`
              )
            );
            controller.close();
            clearInterval(intervalId);
            return;
          }

          // Check if session completed or failed
          if (currentSession.status === 'COMPLETED') {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'completed',
                  value: currentSession.scannedValue,
                })}\n\n`
              )
            );
            controller.close();
            clearInterval(intervalId);
            return;
          }

          if (currentSession.status === 'EXPIRED') {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'expired' })}\n\n`
              )
            );
            controller.close();
            clearInterval(intervalId);
            return;
          }

          if (currentSession.status === 'CANCELLED') {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'cancelled' })}\n\n`
              )
            );
            controller.close();
            clearInterval(intervalId);
            return;
          }

          // Expiration is handled inside getScanSession now, so we don't need to check it here manually
          // unless we want to be extra safe, but checking status === 'EXPIRED' above covers it.

          // Send heartbeat to keep connection alive
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (error) {
          console.error('[QR Scan Stream] Error:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', message: 'Internal error' })}\n\n`
            )
          );
          controller.close();
          clearInterval(intervalId);
        }
      }, 500);
    },
    cancel() {
      if (intervalId) {
        clearInterval(intervalId);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
