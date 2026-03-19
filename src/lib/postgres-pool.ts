import type { PoolConfig } from 'pg';

const LOCAL_DATABASE_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function shouldUseSsl(connectionString: string) {
  const { hostname, searchParams } = new URL(connectionString);
  const sslMode = searchParams.get('sslmode')?.toLowerCase();

  if (sslMode) {
    return sslMode !== 'disable';
  }

  return !LOCAL_DATABASE_HOSTS.has(hostname);
}

export function createPgPoolConfig(
  connectionString: string,
  overrides: Omit<PoolConfig, 'connectionString' | 'ssl'> = {},
): PoolConfig {
  return {
    connectionString,
    ...(shouldUseSsl(connectionString)
      ? { ssl: { rejectUnauthorized: false } }
      : {}),
    ...overrides,
  };
}
