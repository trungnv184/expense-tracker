import { expect, test, type Page } from '@playwright/test';
import { seedStore } from './fixtures/db';

const row = (id: string, date: string, category: string, amountMinor: number, note: string, createdAt = `${date}T10:00:00.000Z`) => ({
  id,
  date,
  month: date.slice(0, 7),
  category,
  amountMinor,
  note,
  recurringId: null,
  createdAt,
});

const OCT = [
  row('o1', '2026-10-27', 'food', 1250, 'Lunch with team'),
  row('o2', '2026-10-20', 'education', 12000, 'Online course'),
  row('o3', '2026-10-05', 'education', 25000, 'Tuition'),
  row('o4', '2026-10-01', 'living', 50000, 'Rent'),
];
const SEP = [row('s1', '2026-09-30', 'sport', 4500, 'Badminton'), row('s2', '2026-09-02', 'food', 800, 'Coffee')];

async function seed(page: Page) {
  await page.clock.setFixedTime(new Date(2026, 9, 28, 12, 0));
  await page.goto('./#/');
  await seedStore(page, 'expenses', [...OCT, ...SEP]);
  await page.reload();
}

const notes = (page: Page) => page.locator('.expense-list .note').allTextContents();

test.describe('Monthly expense list (REQ-005)', () => {
  test('shows the current month newest first with the month total', async ({ page }) => {
    await seed(page);
    await expect(page.getByRole('heading', { level: 1, name: 'October 2026' })).toBeVisible();
    await expect(page.getByTestId('month-total')).toHaveText('$882.50');
    expect(await notes(page)).toEqual(['Lunch with team', 'Online course', 'Tuition', 'Rent']);
  });

  test('previous month shows only that month, newest first', async ({ page }) => {
    await seed(page);
    await page.getByRole('button', { name: /Previous month/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'September 2026' })).toBeVisible();
    await expect(page).toHaveURL(/month=2026-09/);
    expect(await notes(page)).toEqual(['Badminton', 'Coffee']);
  });

  test('filters by one category and clears the filter', async ({ page }) => {
    await seed(page);
    await page.getByRole('button', { name: /Education/ }).click();
    await expect(page).toHaveURL(/cat=education/);
    expect(await notes(page)).toEqual(['Online course', 'Tuition']);
    await page.getByRole('button', { name: 'All', exact: true }).click();
    await expect(page.locator('.expense-list .note')).toHaveCount(4);
  });

  test('?cat= deep link applies the filter', async ({ page }) => {
    await seed(page);
    await page.goto('./#/?month=2026-10&cat=living');
    await expect(page.getByRole('button', { name: /Living cost/ })).toHaveAttribute('aria-pressed', 'true');
    expect(await notes(page)).toEqual(['Rent']);
  });

  test('empty month shows an empty state with an Add expense action', async ({ page }) => {
    await seed(page);
    await page.getByRole('button', { name: /Next month/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'November 2026' })).toBeVisible();
    await expect(page.getByText('Nothing recorded yet')).toBeVisible();
    await page.getByRole('main').getByRole('link', { name: '+ Add expense' }).click();
    await expect(page).toHaveURL(/#\/expenses\/new/);
  });

  test('shows amounts in the chosen currency (REQ-013)', async ({ page }) => {
    await seed(page);
    await seedStore(page, 'settings', [{ key: 'currency', value: 'EUR' }]);
    await page.reload();
    await expect(page.getByTestId('month-total')).toHaveText(/882,50\s€/);
  });

  test('no horizontal scroll at 360px with content (REQ-017)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await seed(page);
    await expect(page.locator('.expense-list')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('a newly added expense appears in the list (REQ-001)', async ({ page }) => {
    await page.clock.setFixedTime(new Date(2026, 9, 28, 12, 0));
    await page.goto('./#/expenses/new');
    await page.getByLabel('Amount').fill('12.50');
    await page.getByRole('radio', { name: /Food/ }).check();
    await page.getByLabel(/Note/).fill('Lunch with team');
    await page.getByRole('button', { name: 'Save expense' }).click();
    await expect(page.locator('.expense-list .note')).toHaveText(['Lunch with team']);
    await expect(page.getByTestId('month-total')).toHaveText('$12.50');
  });
});
