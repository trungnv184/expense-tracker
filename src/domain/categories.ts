export type CategoryId = 'food' | 'education' | 'charity' | 'sport' | 'living';

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
  /** CSS custom property holding the category colour (see styles/tokens.css). */
  colorVar: string;
}

/** The five fixed categories, in display order (REQ-002). */
export const CATEGORIES: readonly Category[] = [
  { id: 'food', label: 'Food', icon: '🍜', colorVar: '--c-food' },
  { id: 'education', label: 'Education', icon: '📚', colorVar: '--c-education' },
  { id: 'charity', label: 'Charity', icon: '🤝', colorVar: '--c-charity' },
  { id: 'sport', label: 'Sport', icon: '🏸', colorVar: '--c-sport' },
  { id: 'living', label: 'Living cost', icon: '🏠', colorVar: '--c-living' },
];

export const CATEGORY_IDS: readonly CategoryId[] = CATEGORIES.map((c) => c.id);

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && (CATEGORY_IDS as readonly string[]).includes(value);
}

export function getCategory(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id)!;
}
