import { expect, test } from '@playwright/test';
import { readExpenses } from './fixtures/db';

test('after the first load the app works fully offline (REQ-016)', async ({ page, context }) => {
  await page.clock.setFixedTime(new Date(2026, 9, 28, 12, 0));
  await page.goto('./#/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Reload once so the service worker controls the page.
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'October 2026' })).toBeVisible();

  await page.getByRole('link', { name: /Add expense/ }).first().click();
  await page.getByLabel('Amount').fill('7.25');
  await page.getByRole('radio', { name: /Food/ }).check();
  await page.getByRole('button', { name: 'Save expense' }).click();
  await expect(page.locator('.expense-list .amt')).toHaveText(['$7.25']);

  await page.getByRole('navigation', { name: /Main/ }).first().getByRole('link', { name: /Summary/ }).click();
  await expect(page.getByTestId('summary-total')).toHaveText('$7.25');

  await page.goto('./#/settings');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export CSV/ }).click();
  expect((await download).suggestedFilename()).toBe('expenses-2026-10-28.csv');
  expect(await readExpenses(page)).toHaveLength(1);
  await context.setOffline(false);
});
