import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { today } from '../../domain/dates';
import { csvFilename, toCsv } from '../../domain/csv';
import { formatAmount } from '../../domain/money';
import { expensesRepo } from '../../data/expensesRepo';
import { settingsRepo } from '../../data/settingsRepo';
import { PageHeading } from '../components/PageHeading';
import { useCurrency } from '../hooks/useCurrency';
import { useToast } from '../hooks/useToast';

export const CURRENCIES = [
  { code: 'USD', name: 'US dollar' },
  { code: 'VND', name: 'Vietnamese đồng' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British pound' },
  { code: 'JPY', name: 'Japanese yen' },
  { code: 'AUD', name: 'Australian dollar' },
  { code: 'CAD', name: 'Canadian dollar' },
  { code: 'SGD', name: 'Singapore dollar' },
] as const;

function download(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function SettingsPage() {
  const currency = useCurrency();
  const toast = useToast();
  const count = useLiveQuery(() => expensesRepo.count(), [], undefined);
  const [busy, setBusy] = useState(false);

  async function changeCurrency(code: string) {
    try {
      await settingsRepo.setCurrency(code);
      toast(`Currency set to ${code}`);
    } catch {
      toast('Couldn’t change the currency');
    }
  }

  async function exportCsv() {
    setBusy(true);
    try {
      const all = await expensesRepo.all();
      const name = csvFilename(today());
      download(toCsv(all), name);
      toast(`Downloaded ${name}`);
    } catch {
      toast('Export failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 640, display: 'grid', gap: 24 }}>
      <PageHeading eyebrow="Preferences & data" title="Settings" />

      <section className="card card-pad" aria-labelledby="cur-h">
        <h2 id="cur-h">Currency</h2>
        <p className="muted" style={{ margin: '4px 0 16px' }}>
          Used to display every amount. Changing it doesn’t convert or alter stored values.
        </p>
        <div className="field">
          <label htmlFor="currency">Currency</label>
          <select id="currency" value={currency} onChange={(e) => changeCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}: {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="notice">
          Preview:{' '}
          <b className="num" data-testid="currency-preview">
            {formatAmount(1250, currency)} · {formatAmount(126120, currency)}
          </b>
        </div>
      </section>

      <section className="card card-pad" aria-labelledby="exp-h">
        <h2 id="exp-h">Export</h2>
        <p className="muted" style={{ margin: '4px 0 16px' }}>
          Download every expense as a CSV file you can open in Excel, Numbers or Google Sheets. It’s also your backup.
        </p>
        <button type="button" className="btn primary" onClick={exportCsv} disabled={busy}>
          ⤓ Export CSV
        </button>
        <span className="muted" style={{ marginLeft: 8, fontSize: 13 }}>
          {csvFilename(today())}
          {count !== undefined && ` · ${count} expense${count === 1 ? '' : 's'}`}
        </span>
      </section>

      <section className="card card-pad" aria-labelledby="data-h">
        <h2 id="data-h">Your data</h2>
        <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--ink-2)' }}>
          <li>Stored only in this browser on this device. No account, nothing sent to a server.</li>
          <li>Works offline once loaded.</li>
          <li>Clearing your browser’s site data deletes it. Export CSV regularly as a backup.</li>
        </ul>
      </section>
    </main>
  );
}
