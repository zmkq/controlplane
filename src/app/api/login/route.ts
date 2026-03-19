import { NextResponse } from 'next/server';

export async function POST() {
  // Temporarily bypass authentication and always succeed
  return NextResponse.json({ message: 'Logged in successfully' });
}
