import { createImgBBClient, getImgBBThumbnail } from '@/lib/imgbb';

describe('createImgBBClient', () => {
  it('rejects uploads when the API key is missing', async () => {
    const client = createImgBBClient({ apiKey: undefined });

    await expect(client.upload('abc123')).rejects.toThrow(
      'ImgBB API key not configured',
    );
  });

  it('returns the uploaded image URL on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: { url: 'https://i.ibb.co/image.png' },
      }),
    });

    const client = createImgBBClient({
      apiKey: 'imgbb-key',
      fetchImpl: fetchMock as typeof fetch,
    });

    await expect(client.upload('abc123')).resolves.toBe(
      'https://i.ibb.co/image.png',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('surfaces API error messages from unsuccessful responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: vi.fn().mockResolvedValue({
        error: { message: 'Image payload is invalid' },
      }),
    });

    const client = createImgBBClient({
      apiKey: 'imgbb-key',
      fetchImpl: fetchMock as typeof fetch,
    });

    await expect(client.upload('abc123')).rejects.toThrow(
      'Image payload is invalid',
    );
  });

  it('converts timeouts into a clear error', async () => {
    const timeoutError = Object.assign(new Error('Request timed out'), {
      name: 'TimeoutError',
    });
    const fetchMock = vi.fn().mockRejectedValue(timeoutError);
    const client = createImgBBClient({
      apiKey: 'imgbb-key',
      fetchImpl: fetchMock as typeof fetch,
    });

    await expect(client.upload('abc123')).rejects.toThrow(
      'ImgBB upload timed out',
    );
  });

  it('rejects successful responses that omit a usable URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        data: {},
      }),
    });

    const client = createImgBBClient({
      apiKey: 'imgbb-key',
      fetchImpl: fetchMock as typeof fetch,
    });

    await expect(client.upload('abc123')).rejects.toThrow(
      'Failed to get image URL from ImgBB',
    );
  });
});

describe('getImgBBThumbnail', () => {
  it('returns ImgBB URLs unchanged', () => {
    expect(getImgBBThumbnail('https://i.ibb.co/abc123/image.png')).toBe(
      'https://i.ibb.co/abc123/image.png',
    );
  });

  it('returns non-ImgBB URLs unchanged', () => {
    expect(getImgBBThumbnail('https://example.com/image.png')).toBe(
      'https://example.com/image.png',
    );
  });
});
