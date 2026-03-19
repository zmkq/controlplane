import { describe, expect, it } from 'vitest';
import { createPgPoolConfig } from '@/lib/postgres-pool';

describe('createPgPoolConfig', () => {
  it('disables ssl for localhost connections by default', () => {
    const config = createPgPoolConfig(
      'postgresql://postgres:postgres@localhost:5432/controlplane',
    );

    expect(config.ssl).toBeUndefined();
  });

  it('enables ssl for remote hosts by default', () => {
    const config = createPgPoolConfig(
      'postgresql://postgres:postgres@db.example.com:5432/controlplane',
    );

    expect(config.ssl).toEqual({ rejectUnauthorized: false });
  });

  it('respects explicit sslmode=disable', () => {
    const config = createPgPoolConfig(
      'postgresql://postgres:postgres@db.example.com:5432/controlplane?sslmode=disable',
    );

    expect(config.ssl).toBeUndefined();
  });
});
