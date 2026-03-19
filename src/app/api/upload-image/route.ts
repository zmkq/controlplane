import { NextRequest, NextResponse } from 'next/server';
import { uploadToImgBB } from '@/lib/imgbb';

/**
 * POST /api/upload-image
 * Uploads an image to ImgBB and returns the URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, type } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Validate base64 format (remove data URI prefix if present)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // Validate file size (max 32MB for ImgBB)
    const sizeInBytes = (base64Data.length * 3) / 4;
    const maxSize = 32 * 1024 * 1024; // 32MB (ImgBB limit)

    if (sizeInBytes > maxSize) {
      return NextResponse.json(
        { error: 'Image size exceeds 32MB limit' },
        { status: 400 }
      );
    }

    // Validate image type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const imageType = type || 'image/png';

    if (!allowedTypes.includes(imageType.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid image type. Allowed: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const imageUrl = await uploadToImgBB(base64Data);

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to upload image',
      },
      { status: 500 }
    );
  }
}
