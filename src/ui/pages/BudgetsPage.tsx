import { useLiveQuery } from 'dexie-react-hooks';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORIES, type CategoryId } from '../../domain/categories';
import { minorToDecimal } from '../../domain/money';
import { validateBudget } from '../../domain/validation';
import { budgetsRepo, type BudgetMap } from '../../data/budgetsRepo';
import { AmountInput } from '../components/AmountInput';
import { CategoryBadge } from '../components/CategoryBadge';
import { PageHeading } from '../components/PageHeading';
import { useCurrency } from '../hooks/useCurrency';
import { useToast } from '../hooks/useToast';

export function BudgetsPage() {
  const budgets = useLiveQuery(() => budgetsRepo.all(), []);
  return (
    <main style={{ maxWidth: 640 }}>
      <PageHeading eyebrow="Monthly limits" title="Budgets" />
      <p className="muted" style={{ margin: '-12px 0 24px' }}>
        One amount per category. It applies to every month until you change it, and resets on the 1st.
      </p>
      {budgets ? (
        <BudgetsForm initial={budgets} />
      ) : (
        <p className="muted" aria-busy="true">
          Loading…
        </p>
      )}
    </main>
  );
}

type Values = Record<CategoryId, string>;

function BudgetsForm({ initial }: { initial: BudgetMap }) {
  const navigate = useNavigate();
  const toast = useToast();
  const currency = useCurrency();
  const [values, setValues] = useState<Values>(
    () => Object.fromEntries(CATEGORIES.map((c) => [c.id, initial[c.id] ? minorToDecimal(initial[c.id]!) : ''])) as Values,
  );
  const [errors, setErrors] = useState<Partial<Record<CategoryId, string>>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const changes: Partial<Record<CategoryId, number | null>> = {};
    const errs: Partial<Record<CategoryId, string>> = {};
    for (const c of CATEGORIES) {
      const raw = values[c.id].trim();
      if (raw === '') {
        changes[c.id] = null;
        continue;
      }
      const r = validateBudget(raw);
      if (r.ok) changes[c.id] = r.value;
      else errs[c.id] = 'Enter an amount greater than 0, or clear the budget.';
    }
    setErrors(errs);
    const firstBad = CATEGORIES.find((c) => errs[c.id]);
    if (firstBad) {
      document.getElementById(`budget-${firstBad.id}`)?.focus();
      return;
    }
    try {
      await budgetsRepo.saveAll(changes);
      toast('Budgets saved');
      navigate('/summary');
    } catch {
      setSaveError('Couldn’t save budgets. Please try again.');
    }
  }

  return (
    <form className="card card-pad" noValidate onSubmit={onSubmit} aria-label="Budgets">
      {saveError && (
        <div className="notice err" role="alert" style={{ marginBottom: 16 }}>
          {saveError}
        </div>
      )}
      {CATEGORIES.map((c) => (
        <div className="budget-row" key={c.id} data-category={c.id}>
          <CategoryBadge id={c.id} />
          <AmountInput
            id={`budget-${c.id}`}
            label={`${c.label} monthly budget`}
            compact
            value={values[c.id]}
            currency={currency}
            onChange={(v) => setValues((s) => ({ ...s, [c.id]: v }))}
            error={errors[c.id]}
          />
          {values[c.id] ? (
            <button
              type="button"
              className="btn ghost small"
              onClick={() => setValues((s) => ({ ...s, [c.id]: '' }))}
              aria-label={`Clear ${c.label} budget`}
            >
              Clear
            </button>
          ) : (
            <span className="status none">No budget</span>
          )}
        </div>
      ))}
      <div className="actions">
        <Link className="btn ghost" to="/summary">
          Cancel
        </Link>
        <button className="btn primary" type="submit">
          Save budgets
        </button>
      </div>
    </form>
  );
}
