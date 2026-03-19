/**
 * ImgBB API client for image uploads
 * Documentation: https://api.imgbb.com/
 */

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
export const isImgbbConfigured = Boolean(IMGBB_API_KEY);

export interface ImgBBUploadResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: string;
    height: string;
    size: string;
    time: string;
    expiration: string;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    medium: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

/**
 * Upload an image to ImgBB
 * @param imageBase64 - Base64 encoded image data (without data URI prefix)
 * @returns ImgBB image URL
 */
export async function uploadToImgBB(imageBase64: string): Promise<string> {
  if (!isImgbbConfigured || !IMGBB_API_KEY) {
    throw new Error('ImgBB API key not configured');
  }

  const formData = new FormData();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', imageBase64);

  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Unknown error' }));
    throw new Error(
      error.error?.message || `ImgBB upload failed: ${response.statusText}`
    );
  }

  const data: ImgBBUploadResponse = await response.json();

  if (!data.success || !data.data.url) {
    throw new Error('Failed to get image URL from ImgBB');
  }

  return data.data.url;
}

/**
 * Get ImgBB image URL (ImgBB handles optimization automatically)
 * @param imgbbUrl - Full ImgBB URL (e.g., https://i.ibb.co/abc123/image.png)
 * @returns Original URL (ImgBB handles optimization automatically)
 */
export function getImgBBThumbnail(imgbbUrl: string): string {
  if (!imgbbUrl || !imgbbUrl.includes('ibb.co')) {
    return imgbbUrl;
  }

  // ImgBB URLs are already optimized automatically
  // Return the original URL as-is
  return imgbbUrl;
}
