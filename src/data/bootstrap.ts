import { db } from './db';
import { recurringRepo } from './recurringRepo';

export type BootResult = { ok: true; generated: number } | { ok: false; reason: string };

/** Open the database, ask the browser to keep our data (REQ-014) and add due recurring expenses (REQ-010). */
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
  let generated = 0;
  try {
    generated = await recurringRepo.generateDue();
  } catch (e) {
    // The transaction rolled back; it is retried on the next open (design §6.6).
    console.error('Recurring generation failed', e);
  }
  return { ok: true, generated };
}
