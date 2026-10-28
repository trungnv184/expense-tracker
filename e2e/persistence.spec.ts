import { expect, test } from '@playwright/test';

/** Reads every row of an object store in the app's "ledger" IndexedDB database. */
async function readStore(page: import('@playwright/test').Page, store: string) {
  return page.evaluate(
    (name) =>
      new Promise<unknown[]>((resolve, reject) => {
        const req = indexedDB.open('ledger');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const get = req.result.transaction(name).objectStore(name).getAll();
          get.onsuccess = () => {
            resolve(get.result);
            req.result.close();
          };
          get.onerror = () => reject(get.error);
        };
      }),
    store,
  );
}

test('the app creates its database and data survives a reload (REQ-014)', async ({ page }) => {
  await page.goto('./#/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // No UI writes data yet (M2), so write a row straight into the database the app created.
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('ledger');
        req.onsuccess = () => {
          const tx = req.result.transaction('settings', 'readwrite');
          tx.objectStore('settings').put({ key: 'currency', value: 'VND' });
          tx.oncomplete = () => {
            req.result.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      }),
  );

  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await readStore(page, 'settings')).toEqual([{ key: 'currency', value: 'VND' }]);

  const fresh = await page.context().newPage();
  await fresh.goto('./#/');
  expect(await readStore(fresh, 'settings')).toEqual([{ key: 'currency', value: 'VND' }]);
});

test('shows a clear notice when storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true });
  });
  await page.goto('./#/');
  await expect(page.getByRole('heading', { name: 'Storage is unavailable' })).toBeVisible();
});


test('expenses, budgets, recurring items and currency survive a reload and a new page (REQ-014)', async ({ page, context }) => {
  await page.clock.setFixedTime(new Date(2026, 9, 28, 12, 0));
  await page.goto('./#/');
  for (const [amount, cat] of [['1', 'Food'], ['2', 'Education'], ['3', 'Charity'], ['4', 'Sport'], ['5', 'Living cost']] as const) {
    await page.goto('./#/expenses/new');
    await page.getByLabel('Amount').fill(amount);
    await page.getByRole('radio', { name: new RegExp(cat) }).check();
    await page.getByRole('button', { name: 'Save expense' }).click();
    await expect(page).toHaveURL(/#\/\?month=2026-10$/);
  }
  await page.goto('./#/budgets');
  await page.getByLabel('Food monthly budget').fill('300');
  await page.getByRole('button', { name: 'Save budgets' }).click();
  await expect(page).toHaveURL(/#\/summary$/);
  await page.goto('./#/recurring/new');
  await page.getByLabel('Note').fill('Gym');
  await page.getByLabel('Amount').fill('35');
  await page.getByRole('radio', { name: /Sport/ }).check();
  await page.getByLabel('Day of month').selectOption('28');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText(/expenses? (was|were) added/)).toBeVisible();
  await page.goto('./#/settings');
  await page.getByRole('combobox', { name: 'Currency' }).selectOption('EUR');
  await expect(page.getByTestId('currency-preview')).toContainText('€');

  for (const p of [page, await context.newPage()]) {
    if (p === page) await p.reload();
    await p.clock.setFixedTime(new Date(2026, 9, 28, 12, 0));
    await p.goto('./#/?month=2026-10');
    await expect(p.locator('.expense-list .row')).toHaveCount(6);
    await p.goto('./#/budgets');
    await expect(p.getByLabel('Food monthly budget')).toHaveValue('300.00');
    await p.goto('./#/recurring');
    await expect(p.getByRole('heading', { name: 'Gym' })).toBeVisible();
    await p.goto('./#/settings');
    await expect(p.getByRole('combobox', { name: 'Currency' })).toHaveValue('EUR');
  }
});
