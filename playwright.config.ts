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

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'bunx next dev --hostname 127.0.0.1 --port 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
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
