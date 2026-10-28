import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import { amountInputFormat, currencySymbol, formatAmountInput, unformatAmountInput } from '../../domain/money';

interface Props {
  id: string;
  label: string;
  /** Plain decimal string, e.g. "1000000" or "12.50"; grouping is added only for display. */
  value: string;
  currency: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  compact?: boolean;
}

/** Characters that carry meaning in the field; grouping separators are not among them. */
function significantBefore(text: string, pos: number, group: string): number {
  let n = 0;
  for (let i = 0; i < pos; i++) if (text.charAt(i) !== group && !/\s/.test(text.charAt(i))) n++;
  return n;
}

function positionAfter(text: string, count: number, group: string): number {
  if (count === 0) return 0;
  let n = 0;
  for (let i = 0; i < text.length; i++) {
    if (text.charAt(i) !== group && !/\s/.test(text.charAt(i))) n++;
    if (n === count) return i + 1;
  }
  return text.length;
}

export const AmountInput = forwardRef<HTMLInputElement, Props>(function AmountInput(
  { id, label, value, currency, onChange, error, hint, compact },
  ref,
) {
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;
  const fmt = useMemo(() => amountInputFormat(currency), [currency]);
  const display = formatAmountInput(value, fmt);
  const symbol = <span aria-hidden="true">{currencySymbol(currency)}</span>;

  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current!);
  // Keep the caret next to the digit the user just typed when separators are added or removed.
  const pendingCaret = useRef<number | null>(null);
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (pendingCaret.current === null || !el || document.activeElement !== el) return;
    const pos = positionAfter(el.value, pendingCaret.current, fmt.group);
    pendingCaret.current = null;
    el.setSelectionRange(pos, pos);
  });

  return (
    <div className={`field${error ? ' invalid' : ''}`}>
      <label htmlFor={id} className={compact ? 'sr-only' : undefined}>
        {label}
      </label>
      <div className={`amount-input${fmt.symbolAfter ? ' suffix' : ''}`}>
        {!fmt.symbolAfter && symbol}
        <input
          ref={inputRef}
          id={id}
          inputMode={fmt.fractionDigits === 0 ? 'numeric' : 'decimal'}
          autoComplete="off"
          placeholder={fmt.fractionDigits === 0 ? '0' : `0${fmt.decimal}00`}
          value={display}
          onChange={(e) => {
            const text = e.target.value;
            pendingCaret.current = significantBefore(text, e.target.selectionStart ?? text.length, fmt.group);
            onChange(unformatAmountInput(text, fmt));
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={[error ? errId : '', hint ? hintId : ''].filter(Boolean).join(' ') || undefined}
        />
        {fmt.symbolAfter && symbol}
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
