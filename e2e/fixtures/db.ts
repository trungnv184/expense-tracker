import type { Page } from '@playwright/test';

/** Run a callback against the app's "ledger" IndexedDB database inside the page. */
export async function readStore<T = Record<string, unknown>>(page: Page, store: string): Promise<T[]> {
  return page.evaluate(
    (name) =>
      new Promise<T[]>((resolve, reject) => {
        const req = indexedDB.open('ledger');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const get = req.result.transaction(name).objectStore(name).getAll();
          get.onsuccess = () => {
            resolve(get.result as T[]);
            req.result.close();
          };
          get.onerror = () => reject(get.error);
        };
      }),
    store,
  );
}

export const readExpenses = (page: Page) => readStore(page, 'expenses');

/** Insert rows into a store of the app's database (the app must have opened it first). */
export async function seedStore(page: Page, store: string, rows: unknown[]): Promise<void> {
  await page.evaluate(
    ([name, data]) =>
      new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('ledger');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const tx = req.result.transaction(name as string, 'readwrite');
          for (const row of data as unknown[]) tx.objectStore(name as string).put(row);
          tx.oncomplete = () => {
            req.result.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    [store, rows] as const,
  );
}
