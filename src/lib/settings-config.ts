export const DEFAULT_APP_SETTINGS = {
  language: 'en',
  phoneFormat: 'international',
  timezone: 'Asia/Amman',
  brandColor: '#dbec0a',
  emailNotifications: true,
  smsNotifications: false,
} as const;

const FALLBACK_TIMEZONES = [
  'UTC',
  'Asia/Amman',
  'Asia/Riyadh',
  'Asia/Dubai',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
] as const;

export const SUPPORTED_TIMEZONES =
  typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('timeZone')
    : [...FALLBACK_TIMEZONES];

export function isValidTimezone(timezone: string) {
  return SUPPORTED_TIMEZONES.includes(timezone);
}

export function normalizeBrandColor(value: string) {
  const normalized = value.trim();
  if (/^#[0-9a-f]{3}$/i.test(normalized) || /^#[0-9a-f]{6}$/i.test(normalized)) {
    return normalized.toLowerCase();
  }

  return null;
}
