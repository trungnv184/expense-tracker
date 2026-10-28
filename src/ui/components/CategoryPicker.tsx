import { CATEGORIES, type CategoryId } from '../../domain/categories';

interface Props {
  name: string;
  value: CategoryId | null;
  onChange: (id: CategoryId) => void;
  error?: string;
  legend?: string;
}

/** Radio group of the fixed categories (REQ-002), keyboard operable (REQ-018). */
export function CategoryPicker({ name, value, onChange, error, legend = 'Category' }: Props) {
  const errId = `${name}-err`;
  return (
    <fieldset className={`field${error ? ' invalid' : ''}`} style={{ border: 0, padding: 0 }}>
      <legend>{legend}</legend>
      <div className="cat-picker" role="radiogroup" aria-describedby={error ? errId : undefined}>
        {CATEGORIES.map((c) => (
          <label key={c.id} className={c.id}>
            <input
              type="radio"
              name={name}
              value={c.id}
              checked={value === c.id}
              onChange={() => onChange(c.id)}
            />
            <span className="tile">
              <b aria-hidden="true">{c.icon}</b>
              {c.label}
            </span>
          </label>
        ))}
      </div>
      <span className="error" id={errId} role={error ? 'alert' : undefined}>
        {error}
      </span>
    </fieldset>
  );
}
