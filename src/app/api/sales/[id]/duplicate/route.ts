import { NextResponse } from 'next/server';
import { getOrderForDuplicate } from '@/app/sales/new/actions';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const orderData = await getOrderForDuplicate(id);
  
  if (!orderData) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json(orderData);
}

