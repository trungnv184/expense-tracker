import { expect, test } from '@playwright/test';

const ROUTES: [string, string | RegExp][] = [
  ['#/', /^[A-Z][a-z]+ \d{4}$/],
  ['#/expenses/new', 'New expense'],
  ['#/summary', /^[A-Z][a-z]+ \d{4}$/],
  ['#/budgets', 'Budgets'],
  ['#/recurring', 'Recurring'],
  ['#/recurring/new', 'New recurring expense'],
  ['#/settings', 'Settings'],
];

for (const width of [360, 1280]) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    for (const [hash, heading] of ROUTES) {
      test(`${hash} renders without horizontal scroll`, async ({ page }) => {
        await page.goto(`./${hash}`);
        await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
      });
    }

    test('shows the right navigation for the width', async ({ page }) => {
      await page.goto('./#/');
      const desktop = page.getByRole('navigation', { name: 'Main', exact: true });
      const mobile = page.getByRole('navigation', { name: 'Main (mobile)' });
      if (width >= 768) {
        await expect(desktop).toBeVisible();
        await expect(mobile).toBeHidden();
      } else {
        await expect(mobile).toBeVisible();
        await expect(desktop).toBeHidden();
      }
      await (width >= 768 ? desktop : mobile).getByRole('link', { name: /Summary/ }).click();
      await expect(page).toHaveURL(/#\/summary$/);
    });
  });
}
