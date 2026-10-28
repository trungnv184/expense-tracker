import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../../domain/categories';
import type { Month } from '../../domain/dates';
import { budgetStatus } from '../../domain/summary';
import { budgetsRepo } from '../../data/budgetsRepo';
import type { Expense } from '../../data/db';
import { BudgetBar } from './BudgetBar';

/** Desktop-only (≥ 1024px) budget panel beside the expense list (REQ-009, REQ-017). */
export function BudgetGlance({ month, expenses, currency }: { month: Month; expenses: Expense[]; currency: string }) {
  const budgets = useLiveQuery(() => budgetsRepo.all(), []);
  if (!budgets) return null;
  const spent = (id: string) => expenses.filter((e) => e.category === id).reduce((s, e) => s + e.amountMinor, 0);
  const withBudget = CATEGORIES.filter((c) => budgets[c.id]);
  return (
    <aside className="card card-pad glance" aria-label="Budgets at a glance">
      <div className="eyebrow">At a glance</div>
      <h2 style={{ margin: '4px 0 12px' }}>Budgets this month</h2>
      {withBudget.length === 0 ? (
        <p className="muted">
          No budgets yet. <Link to="/budgets">Set budgets</Link>
        </p>
      ) : (
        withBudget.map((c) => (
          <BudgetBar
            key={c.id}
            category={c.id}
            spentMinor={spent(c.id)}
            status={budgetStatus(spent(c.id), budgets[c.id])}
            currency={currency}
            compact
          />
        ))
      )}
      <Link className="btn full" to={`/summary?month=${month}`} style={{ marginTop: 12 }}>
        Open full summary →
      </Link>
    </aside>
  );
}
