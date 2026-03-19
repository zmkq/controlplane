import { expect, test } from '@playwright/test';

test('health endpoint is reachable', async ({ request }) => {
  const response = await request.get('/api/health');
  expect([200, 503]).toContain(response.status());
});

test('manifest is reachable without authentication', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/manifest+json');
});

test('login screen renders Controlplane branding', async ({ page }) => {
  await page.goto('/login');
  await expect(
    page.getByRole('heading', { name: 'Controlplane', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
});
