import { expect, test } from '@playwright/test';

test('no request leaves the origin or carries user data (REQ-016)', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const requests: { url: string; method: string; body: string | null }[] = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method(), body: r.postData() }));

  await page.clock.setFixedTime(new Date(2026, 9, 28, 12, 0));
  await page.goto('./#/');
  await page.goto('./#/expenses/new');
  await page.getByLabel('Amount').fill('42.42');
  await page.getByRole('radio', { name: /Charity/ }).check();
  await page.getByLabel(/Note/).fill('SECRET-NOTE-123');
  await page.getByRole('button', { name: 'Save expense' }).click();
  await page.getByRole('link', { name: /SECRET-NOTE-123/ }).click();
  await page.getByLabel('Amount').fill('43');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.goto('./#/summary');
  await expect(page.getByTestId('summary-total')).toHaveText('$43.00');
  await page.goto('./#/settings');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export CSV/ }).click();
  await download;

  const external = requests.filter((r) => !r.url.startsWith(origin) && !r.url.startsWith('blob:') && !r.url.startsWith('data:'));
  expect(external).toEqual([]);
  const withData = requests.filter((r) => r.method !== 'GET' || (r.body ?? '').length > 0 || r.url.includes('SECRET'));
  expect(withData).toEqual([]);
});

test('a strict Content-Security-Policy is set', async ({ page }) => {
  await page.goto('./#/');
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("connect-src 'self'");
});
