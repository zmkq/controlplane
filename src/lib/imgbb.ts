/**
 * ImgBB API client for image uploads
 * Documentation: https://api.imgbb.com/
 */

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';
const DEFAULT_UPLOAD_TIMEOUT_MS = 15_000;

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

type ImgBBFetch = typeof fetch;

type ImgBBClientOptions = {
  apiKey?: string;
  fetchImpl?: ImgBBFetch;
  timeoutMs?: number;
};

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = error.message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  return 'Unknown error';
}

async function readImgBBResponse(response: Response) {
  try {
    return (await response.json()) as Partial<ImgBBUploadResponse> & {
      error?: { message?: string };
    };
  } catch {
    return null;
  }
}

export function createImgBBClient({
  apiKey = IMGBB_API_KEY,
  fetchImpl = fetch,
  timeoutMs = DEFAULT_UPLOAD_TIMEOUT_MS,
}: ImgBBClientOptions = {}) {
  const normalizedApiKey = apiKey?.trim();
  const isConfigured = Boolean(normalizedApiKey);

  return {
    isConfigured,
    async upload(imageBase64: string): Promise<string> {
      if (!isConfigured || !normalizedApiKey) {
        throw new Error('ImgBB API key not configured');
      }

      if (!imageBase64.trim()) {
        throw new Error('Image data is required');
      }

      const formData = new FormData();
      formData.append('key', normalizedApiKey);
      formData.append('image', imageBase64);

      let response: Response;

      try {
        response = await fetchImpl(IMGBB_UPLOAD_URL, {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error) {
        if (
          error &&
          typeof error === 'object' &&
          'name' in error &&
          error.name === 'TimeoutError'
        ) {
          throw new Error('ImgBB upload timed out');
        }

        throw new Error(`ImgBB upload failed: ${getErrorMessage(error)}`);
      }

      const data = await readImgBBResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.error?.message ||
            `ImgBB upload failed: ${response.status} ${response.statusText}`,
        );
      }

      if (!data?.success || !data.data?.url) {
        throw new Error('Failed to get image URL from ImgBB');
      }

      return data.data.url;
    },
  };
}

const imgbbClient = createImgBBClient();
export const isImgbbConfigured = imgbbClient.isConfigured;

/**
 * Upload an image to ImgBB
 * @param imageBase64 - Base64 encoded image data (without data URI prefix)
 * @returns ImgBB image URL
 */
export async function uploadToImgBB(imageBase64: string): Promise<string> {
  return imgbbClient.upload(imageBase64);
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
