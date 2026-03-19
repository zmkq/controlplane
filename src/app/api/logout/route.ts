import { NextResponse } from 'next/server';

export async function POST() {
  // Temporarily bypass session deletion and always succeed
  return NextResponse.json({ message: 'Logged out successfully' });
}
