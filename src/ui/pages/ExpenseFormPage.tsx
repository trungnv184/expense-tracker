import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCategory, type CategoryId } from '../../domain/categories';
import { formatDayHeading, formatMonth, monthOf, today } from '../../domain/dates';
import { AMOUNT_ERROR_TEXT, formatAmount, minorToDecimal } from '../../domain/money';
import { NOTE_MAX, validateExpense, type ExpenseErrors } from '../../domain/validation';
import type { Expense } from '../../data/db';
import { NotFoundError } from '../../data/errors';
import { expensesRepo } from '../../data/expensesRepo';
import { AmountInput } from '../components/AmountInput';
import { CategoryPicker } from '../components/CategoryPicker';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useCurrency } from '../hooks/useCurrency';
import { useToast } from '../hooks/useToast';

/** Add (/expenses/new) or edit (/expenses/:id) an expense (REQ-001, REQ-003, REQ-004). */
export function ExpenseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [existing, setExisting] = useState<Expense | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let live = true;
    expensesRepo.get(id).then(
      (e) => live && setExisting(e),
      (err) => {
        if (!live) return;
        if (err instanceof NotFoundError) {
          toast('Expense no longer exists');
          navigate('/', { replace: true });
        } else {
          setLoadError('Couldn’t load this expense. Please try again.');
        }
      },
    );
    return () => {
      live = false;
    };
  }, [id, navigate, toast]);

  if (!id) return <ExpenseForm key="new" />;
  if (loadError)
    return (
      <main style={{ maxWidth: 560 }}>
        <div className="notice err" role="alert">
          {loadError}
        </div>
      </main>
    );
  if (!existing)
    return (
      <main style={{ maxWidth: 560 }}>
        <p className="muted" aria-busy="true">
          Loading…
        </p>
      </main>
    );
  return <ExpenseForm key={existing.id} existing={existing} />;
}

function ExpenseForm({ existing }: { existing?: Expense }) {
  const navigate = useNavigate();
  const toast = useToast();
  const currency = useCurrency();
  const editing = !!existing;

  const [amount, setAmount] = useState(existing ? minorToDecimal(existing.amountMinor) : '');
  const [category, setCategory] = useState<CategoryId | null>(existing?.category ?? null);
  const [date, setDate] = useState(existing?.date ?? today());
  const [note, setNote] = useState(existing?.note ?? '');
  const [errors, setErrors] = useState<ExpenseErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const backMonth = existing?.month ?? monthOf(date);
  const backTo = `/?month=${backMonth}`;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaveError(null);
    const r = validateExpense({ amount, category, date, note });
    if (!r.ok) {
      setErrors(r.errors);
      if (r.errors.amount) amountRef.current?.focus();
      else if (r.errors.category) formRef.current?.querySelector<HTMLInputElement>('input[name=category]')?.focus();
      else if (r.errors.date) dateRef.current?.focus();
      else noteRef.current?.focus();
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (existing) await expensesRepo.update(existing.id, r.value);
      else await expensesRepo.add(r.value);
      toast(editing ? 'Expense updated' : 'Expense saved');
      navigate(`/?month=${monthOf(r.value.date)}`);
    } catch (err) {
      if (err instanceof NotFoundError) {
        toast('Expense no longer exists');
        navigate(backTo, { replace: true });
        return;
      }
      setSaveError('Couldn’t save the expense. Your data is unchanged, please try again.');
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!existing) return;
    setConfirming(false);
    try {
      await expensesRepo.remove(existing.id);
      toast('Expense deleted');
      navigate(backTo);
    } catch (err) {
      if (err instanceof NotFoundError) {
        toast('Expense no longer exists');
        navigate(backTo, { replace: true });
        return;
      }
      setSaveError('Couldn’t delete the expense. Please try again.');
    }
  }

  return (
    <main style={{ maxWidth: 560 }}>
      <div className="page-head">
        <div>
          <Link to={backTo} className="muted" style={{ textDecoration: 'none' }}>
            ← Back to {formatMonth(backMonth).split(' ')[0]}
          </Link>
          <h1 style={{ marginTop: 8 }}>{editing ? 'Edit expense' : 'New expense'}</h1>
        </div>
      </div>

      {saveError && (
        <div className="notice err" role="alert" style={{ marginBottom: 16 }}>
          {saveError}
        </div>
      )}

      <form
        ref={formRef}
        className="card card-pad"
        noValidate
        onSubmit={onSubmit}
        aria-label={editing ? 'Edit expense' : 'New expense'}
      >
        <AmountInput
          ref={amountRef}
          id="amount"
          label="Amount"
          value={amount}
          currency={currency}
          onChange={setAmount}
          error={errors.amount && AMOUNT_ERROR_TEXT[errors.amount]}
          hint="Up to 2 decimals, no thousands separators."
        />

        <CategoryPicker
          name="category"
          value={category}
          onChange={setCategory}
          error={errors.category && 'Pick a category.'}
        />

        <div className={`field${errors.date ? ' invalid' : ''}`}>
          <label htmlFor="date">Date</label>
          <input ref={dateRef} id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <span className="error">Enter a valid date.</span>
        </div>

        <div className={`field${errors.note ? ' invalid' : ''}`}>
          <label htmlFor="note">
            Note <span className="muted">(optional)</span>
          </label>
          <input
            ref={noteRef}
            id="note"
            maxLength={NOTE_MAX}
            placeholder="e.g. Lunch with team"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <span className="hint">Up to {NOTE_MAX} characters.</span>
          <span className="error">Keep the note to {NOTE_MAX} characters.</span>
        </div>

        <div className="actions" style={editing ? { justifyContent: 'space-between' } : undefined}>
          {editing && (
            <button type="button" className="btn ghost" style={{ color: 'var(--danger)' }} onClick={() => setConfirming(true)}>
              Delete
            </button>
          )}
          <span style={{ display: 'flex', gap: 12 }}>
            <Link className="btn ghost" to={backTo}>
              Cancel
            </Link>
            <button className="btn primary" type="submit" disabled={saving}>
              {editing ? 'Save changes' : 'Save expense'}
            </button>
          </span>
        </div>
      </form>

      {existing && (
        <ConfirmDialog
          open={confirming}
          title="Delete this expense?"
          confirmLabel="Delete"
          onConfirm={onDelete}
          onCancel={() => setConfirming(false)}
        >
          <p className="muted">
            {formatAmount(existing.amountMinor, currency)} · {getCategory(existing.category).label} ·{' '}
            {formatDayHeading(existing.date)}
            {existing.note ? ` · “${existing.note}”` : ''}. {formatMonth(existing.month)} totals will update. This can’t be
            undone.
          </p>
        </ConfirmDialog>
      )}
    </main>
  );
}
