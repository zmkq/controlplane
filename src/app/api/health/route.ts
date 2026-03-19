import { NextResponse } from 'next/server';
import { getApplicationHealth } from '@/lib/ops-health';

export async function GET() {
  const health = await getApplicationHealth();

  return NextResponse.json(health, {
    status: health.status === 'ok' ? 200 : 503,
  });
}
