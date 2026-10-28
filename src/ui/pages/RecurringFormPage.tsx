import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { CategoryId } from '../../domain/categories';
import { monthOf, today } from '../../domain/dates';
import { AMOUNT_ERROR_TEXT, minorToDecimal } from '../../domain/money';
import { NOTE_MAX, validateRecurring, type RecurringErrors } from '../../domain/validation';
import type { Recurring } from '../../data/db';
import { NotFoundError } from '../../data/errors';
import { recurringRepo } from '../../data/recurringRepo';
import { AmountInput } from '../components/AmountInput';
import { CategoryPicker } from '../components/CategoryPicker';
import { useCurrency } from '../hooks/useCurrency';
import { useToast } from '../hooks/useToast';

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

/** Create (/recurring/new) or edit (/recurring/:id) a recurring expense (REQ-010, REQ-011). */
export function RecurringFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [existing, setExisting] = useState<Recurring | null>(null);

  useEffect(() => {
    if (!id) return;
    let live = true;
    recurringRepo.get(id).then(
      (r) => live && setExisting(r),
      (err) => {
        if (!live) return;
        toast(err instanceof NotFoundError ? 'Recurring expense no longer exists' : 'Couldn’t load it. Please try again.');
        navigate('/recurring', { replace: true });
      },
    );
    return () => {
      live = false;
    };
  }, [id, navigate, toast]);

  if (!id) return <RecurringForm key="new" />;
  if (!existing)
    return (
      <main style={{ maxWidth: 560 }}>
        <p className="muted" aria-busy="true">
          Loading…
        </p>
      </main>
    );
  return <RecurringForm key={existing.id} existing={existing} />;
}

function RecurringForm({ existing }: { existing?: Recurring }) {
  const navigate = useNavigate();
  const toast = useToast();
  const currency = useCurrency();
  const editing = !!existing;

  const [note, setNote] = useState(existing?.note ?? '');
  const [amount, setAmount] = useState(existing ? minorToDecimal(existing.amountMinor) : '');
  const [category, setCategory] = useState<CategoryId | null>(existing?.category ?? null);
  const [day, setDay] = useState(String(existing?.dayOfMonth ?? 1));
  const [startMonth, setStartMonth] = useState(existing?.startMonth ?? monthOf(today()));
  const [errors, setErrors] = useState<RecurringErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaveError(null);
    const r = validateRecurring({ amount, category, note, dayOfMonth: day, startMonth });
    if (!r.ok) {
      setErrors(r.errors);
      const first = r.errors.amount ? 'rec-amount' : r.errors.category ? null : r.errors.dayOfMonth ? 'day' : r.errors.startMonth ? 'start' : 'rec-note';
      if (first) document.getElementById(first)?.focus();
      else document.querySelector<HTMLInputElement>('input[name=rec-category]')?.focus();
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (existing) {
        const { amountMinor, category, note, dayOfMonth } = r.value;
        await recurringRepo.update(existing.id, { amountMinor, category, note, dayOfMonth });
        toast('Recurring expense updated');
        navigate('/recurring');
      } else {
        await recurringRepo.create(r.value);
        const generated = await recurringRepo.generateDue();
        toast('Recurring expense created');
        navigate('/recurring', { state: { generated } });
      }
    } catch {
      setSaveError('Couldn’t save. Your data is unchanged, please try again.');
      setSaving(false);
    }
  }

  return (
    <main style={{ maxWidth: 560 }}>
      <div className="page-head">
        <div>
          <Link to="/recurring" className="muted" style={{ textDecoration: 'none' }}>
            ← Recurring
          </Link>
          <h1 style={{ marginTop: 8 }}>{editing ? 'Edit recurring expense' : 'New recurring expense'}</h1>
        </div>
      </div>

      {saveError && (
        <div className="notice err" role="alert" style={{ marginBottom: 16 }}>
          {saveError}
        </div>
      )}

      <form className="card card-pad" noValidate onSubmit={onSubmit} aria-label={editing ? 'Edit recurring expense' : 'New recurring expense'}>
        <div className={`field${errors.note ? ' invalid' : ''}`}>
          <label htmlFor="rec-note">Note</label>
          <input id="rec-note" maxLength={NOTE_MAX} placeholder="e.g. Rent" value={note} onChange={(e) => setNote(e.target.value)} />
          <span className="error">Keep the note to {NOTE_MAX} characters.</span>
        </div>

        <AmountInput
          id="rec-amount"
          label="Amount"
          value={amount}
          currency={currency}
          onChange={setAmount}
          error={errors.amount && AMOUNT_ERROR_TEXT[errors.amount]}
        />

        <CategoryPicker name="rec-category" value={category} onChange={setCategory} error={errors.category && 'Pick a category.'} />

        <div className="two-col">
          <div className={`field${errors.dayOfMonth ? ' invalid' : ''}`}>
            <label htmlFor="day">Day of month</label>
            <select id="day" value={day} onChange={(e) => setDay(e.target.value)} aria-describedby="day-hint">
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <span className="hint" id="day-hint">
              Months shorter than this use their last day.
            </span>
            <span className="error">Pick a day from 1 to 31.</span>
          </div>
          <div className={`field${errors.startMonth ? ' invalid' : ''}`}>
            <label htmlFor="start">Start month</label>
            <input
              id="start"
              type="month"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              disabled={editing}
              aria-describedby="start-hint"
            />
            <span className="hint" id="start-hint">
              {editing ? 'Can’t change after creation.' : 'Past months from here are filled in when you save.'}
            </span>
            <span className="error">Enter a month as YYYY-MM.</span>
          </div>
        </div>

        {editing && (
          <div className="notice" style={{ marginBottom: 8 }}>
            Changes apply to months that haven’t been added yet. Expenses already created keep their values.
          </div>
        )}

        <div className="actions">
          <Link className="btn ghost" to="/recurring">
            Cancel
          </Link>
          <button className="btn primary" type="submit" disabled={saving}>
            {editing ? 'Save changes' : 'Create'}
          </button>
        </div>
      </form>
    </main>
  );
}
