import { NextResponse } from 'next/server';
import { getApplicationHealth } from '@/lib/ops-health';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = await getApplicationHealth();

  return NextResponse.json(health, {
    status: health.status === 'ok' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Controlplane-Health': health.status,
    },
  });
}
