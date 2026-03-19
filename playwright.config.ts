import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

function resolveLocalChromiumExecutable() {
  if (process.platform !== 'win32' || !process.env.LOCALAPPDATA) {
    return undefined;
  }

  const playwrightRoot = path.join(process.env.LOCALAPPDATA, 'ms-playwright');
  if (!fs.existsSync(playwrightRoot)) {
    return undefined;
  }

  const chromiumDirs = fs
    .readdirSync(playwrightRoot)
    .filter((entry) => entry.startsWith('chromium-'))
    .sort()
    .reverse();

  for (const directory of chromiumDirs) {
    const candidate = path.join(
      playwrightRoot,
      directory,
      'chrome-win64',
      'chrome.exe',
    );

    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

const localChromiumExecutable = resolveLocalChromiumExecutable();
const testPort = process.env.PLAYWRIGHT_PORT ?? '3007';
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${testPort}`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `bun run build && bunx next start --hostname 127.0.0.1 --port ${testPort}`,
    env: {
      ...process.env,
      AUTH_TRUST_HOST: 'true',
      NEXT_PUBLIC_APP_URL: baseURL,
    },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 240_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(localChromiumExecutable
          ? { launchOptions: { executablePath: localChromiumExecutable } }
          : {}),
      },
    },
  ],
});
