import { detectDeviceType, isMobileDevice } from '@/lib/qr-scan';

describe('isMobileDevice', () => {
  it('returns false when no user agent is provided', () => {
    expect(isMobileDevice()).toBe(false);
  });

  it('detects common mobile user agents', () => {
    expect(
      isMobileDevice(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      ),
    ).toBe(true);
  });

  it('does not mark desktop browsers as mobile', () => {
    expect(
      isMobileDevice(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0.0.0 Safari/537.36',
      ),
    ).toBe(false);
  });
});

describe('detectDeviceType', () => {
  it('classifies iPads and tablet Android devices as tablets', () => {
    expect(
      detectDeviceType(
        'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
      ),
    ).toBe('tablet');

    expect(
      detectDeviceType(
        'Mozilla/5.0 (Linux; Android 14; SM-X910 Build/UP1A.231005.007) AppleWebKit/537.36 Chrome/136.0.0.0 Safari/537.36',
      ),
    ).toBe('tablet');
  });

  it('classifies phones as mobile', () => {
    expect(
      detectDeviceType(
        'Mozilla/5.0 (Linux; Android 14; Pixel 9 Pro Build/UPB5.230623.005) AppleWebKit/537.36 Chrome/136.0.0.0 Mobile Safari/537.36',
      ),
    ).toBe('mobile');
  });

  it('falls back to desktop for non-mobile user agents', () => {
    expect(
      detectDeviceType(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/136.0.0.0 Safari/537.36',
      ),
    ).toBe('desktop');
  });
});
