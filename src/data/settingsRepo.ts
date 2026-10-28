import { db } from './db';
import { guard } from './errors';

export const DEFAULT_CURRENCY = 'USD';

export const settingsRepo = {
  getCurrency(): Promise<string> {
    return guard(async () => (await db.settings.get('currency'))?.value ?? DEFAULT_CURRENCY);
  },

  setCurrency(code: string): Promise<void> {
    return guard(async () => {
      await db.settings.put({ key: 'currency', value: code });
    });
  },
};
