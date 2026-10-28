import { getCategory, type CategoryId } from '../../domain/categories';

export function CategoryBadge({ id, children }: { id: CategoryId; children?: React.ReactNode }) {
  const c = getCategory(id);
  return (
    <span className={`cat ${c.id}`} data-icon={c.icon}>
      {c.label}
      {children}
    </span>
  );
}
