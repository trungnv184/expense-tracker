import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CategoryId } from '../../domain/categories';
import { formatMonth, monthOf, today } from '../../domain/dates';
import { AMOUNT_ERROR_TEXT } from '../../domain/money';
import { NOTE_MAX, validateExpense, type ExpenseErrors } from '../../domain/validation';
import { expensesRepo } from '../../data/expensesRepo';
import { AmountInput } from '../components/AmountInput';
import { CategoryPicker } from '../components/CategoryPicker';
import { useCurrency } from '../hooks/useCurrency';
import { useToast } from '../hooks/useToast';

export function ExpenseFormPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const currency = useCurrency();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<ExpenseErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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
      await expensesRepo.add(r.value);
      toast('Expense saved');
      navigate(`/?month=${monthOf(r.value.date)}`);
    } catch {
      setSaveError('Couldn’t save the expense. Your data is unchanged, please try again.');
      setSaving(false);
    }
  }

  const backMonth = monthOf(date);

  return (
    <main style={{ maxWidth: 560 }}>
      <div className="page-head">
        <div>
          <Link to={`/?month=${backMonth}`} className="muted" style={{ textDecoration: 'none' }}>
            ← Back to {formatMonth(backMonth).split(' ')[0]}
          </Link>
          <h1 style={{ marginTop: 8 }}>New expense</h1>
        </div>
      </div>

      {saveError && (
        <div className="notice err" role="alert" style={{ marginBottom: 16 }}>
          {saveError}
        </div>
      )}

      <form ref={formRef} className="card card-pad" noValidate onSubmit={onSubmit} aria-label="New expense">
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

        <div className="actions">
          <Link className="btn ghost" to={`/?month=${backMonth}`}>
            Cancel
          </Link>
          <button className="btn primary" type="submit" disabled={saving}>
            Save expense
          </button>
        </div>
      </form>
    </main>
  );
}
