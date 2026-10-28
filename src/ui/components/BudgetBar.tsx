import type { ReactNode } from 'react';
import { getCategory, type CategoryId } from '../../domain/categories';
import { formatAmount } from '../../domain/money';
import type { BudgetStatus } from '../../domain/summary';
import { CategoryBadge } from './CategoryBadge';

interface Props {
  category: CategoryId;
  spentMinor: number;
  status: BudgetStatus;
  currency: string;
  compact?: boolean;
  action?: ReactNode;
}

/** Spent vs budget with a progress bar; status always written in words (REQ-009, REQ-018). */
export function BudgetBar({ category, spentMinor, status, currency, compact, action }: Props) {
  const label = getCategory(category).label;
  if (status.kind === 'none') {
    return (
      <div className="budget" data-category={category} data-state="none">
        <div className="top">
          <CategoryBadge id={category} />
          <span className="status none">No budget</span>
        </div>
        {!compact && (
          <div className="figs">
            <span className="num">{formatAmount(spentMinor, currency)} spent</span>
            {action}
          </div>
        )}
      </div>
    );
  }
  const text =
    status.kind === 'over'
      ? `${formatAmount(-status.remainingMinor, currency)} over`
      : `${formatAmount(status.remainingMinor, currency)} left`;
  return (
    <div className={`budget ${status.kind === 'ok' ? '' : status.kind}`} data-category={category} data-state={status.kind}>
      <div className="top">
        <CategoryBadge id={category} />
        <span className={`status ${status.kind}`}>{text}</span>
      </div>
      <div
        className="bar"
        role="progressbar"
        aria-label={`${label} budget used`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(status.percent, 100)}
        aria-valuetext={`${status.percent}%`}
      >
        <i style={{ width: `${Math.min(status.percent, 100)}%` }} />
      </div>
      {!compact && (
        <div className="figs">
          <span className="num">
            {formatAmount(spentMinor, currency)} of {formatAmount(status.budgetMinor, currency)}
          </span>
          <span className="num">
            {status.percent}%{status.kind === 'warn' ? ' · nearly there' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
