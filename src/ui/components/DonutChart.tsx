import { CATEGORIES, type CategoryId } from '../../domain/categories';

interface Props {
  byCategory: Record<CategoryId, number>;
  totalMinor: number;
  label: string;
  size?: number;
}

const R = 40;
const C = 2 * Math.PI * R;

/** Share of spending per category as an SVG ring (REQ-007). */
export function DonutChart({ byCategory, totalMinor, label, size = 160 }: Props) {
  let offset = 0;
  const segments = CATEGORIES.filter((c) => byCategory[c.id] > 0).map((c) => {
    const len = (byCategory[c.id] / totalMinor) * C;
    const seg = { id: c.id, color: `var(${c.colorVar})`, len, offset };
    offset += len;
    return seg;
  });
  return (
    <svg className="donut-svg" width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={label}>
      <circle cx="50" cy="50" r={R} fill="none" stroke="var(--paper-2)" strokeWidth="18" />
      {segments.map((s) => (
        <circle
          key={s.id}
          data-category={s.id}
          data-share={(s.len / C).toFixed(4)}
          cx="50"
          cy="50"
          r={R}
          fill="none"
          stroke={s.color}
          strokeWidth="18"
          strokeDasharray={`${s.len} ${C - s.len}`}
          strokeDashoffset={-s.offset}
          transform="rotate(-90 50 50)"
        />
      ))}
    </svg>
  );
}
