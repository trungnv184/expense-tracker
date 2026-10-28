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
