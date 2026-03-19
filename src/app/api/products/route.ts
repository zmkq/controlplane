import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            where: {
                active: true,
                images: { not: null }
            },
            select: {
                id: true,
                name: true,
                brand: true,
                images: true,
                price: true,
            },
            orderBy: { name: 'asc' },
            take: 100
        });

        // Filter out products with empty images
        const productsWithImages = products.filter(p => p.images && p.images.length > 0);

        return NextResponse.json(productsWithImages);
    } catch (error) {
        console.error('Failed to fetch products:', error);
        return NextResponse.json([], { status: 500 });
    }
}
