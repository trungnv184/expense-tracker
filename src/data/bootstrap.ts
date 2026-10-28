import { db } from './db';

export type BootResult = { ok: true } | { ok: false; reason: string };

/** Open the database and ask the browser to keep our data (REQ-014). */
export async function bootstrap(): Promise<BootResult> {
  try {
    if (typeof indexedDB === 'undefined') throw new Error('IndexedDB is not available in this browser.');
    await db.open();
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
  try {
    await navigator.storage?.persist?.();
  } catch {
    // Persistence is best effort; the app still works without it.
  }
  return { ok: true };
}
