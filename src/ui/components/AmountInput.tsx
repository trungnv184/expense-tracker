import { forwardRef } from 'react';
import { currencySymbol } from '../../domain/money';

interface Props {
  id: string;
  label: string;
  value: string;
  currency: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  compact?: boolean;
}

export const AmountInput = forwardRef<HTMLInputElement, Props>(function AmountInput(
  { id, label, value, currency, onChange, error, hint, compact },
  ref,
) {
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;
  return (
    <div className={`field${error ? ' invalid' : ''}`}>
      <label htmlFor={id} className={compact ? 'sr-only' : undefined}>
        {label}
      </label>
      <div className="amount-input">
        <span aria-hidden="true">{currencySymbol(currency)}</span>
        <input
          ref={ref}
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={[error ? errId : '', hint ? hintId : ''].filter(Boolean).join(' ') || undefined}
        />
      </div>
      {hint && !error && (
        <span className="hint" id={hintId}>
          {hint}
        </span>
      )}
      <span className="error" id={errId}>
        {error}
      </span>
    </div>
  );
});
