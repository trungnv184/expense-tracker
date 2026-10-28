import { useLiveQuery } from 'dexie-react-hooks';
import { DEFAULT_CURRENCY, settingsRepo } from '../../data/settingsRepo';

/** The user's display currency; re-renders when it changes (REQ-013). */
export function useCurrency(): string {
  return useLiveQuery(() => settingsRepo.getCurrency().catch(() => DEFAULT_CURRENCY), [], DEFAULT_CURRENCY);
}
