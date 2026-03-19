import '@testing-library/jest-dom/vitest';

const testEnv = process.env as Record<string, string | undefined>;

testEnv.NODE_ENV ??= 'test';
testEnv.DATABASE_URL ??= 'postgresql://test.example.com/controlplane';
testEnv.DIRECT_URL ??= 'postgresql://test-direct.example.com/controlplane';
testEnv.AUTH_SECRET ??= 'test-auth-secret';
