export type CategoryId =
  | 'food'
  | 'education'
  | 'charity'
  | 'sport'
  | 'living'
  | 'children'
  | 'travel'
  | 'coffee'
  | 'fuel'
  | 'electricity'
  | 'grab'
  | 'water'
  | 'internet'
  | 'shopping'
  | 'health'
  | 'entertainment'
  | 'other';

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
  /** CSS custom property holding the category colour (see styles/tokens.css). */
  colorVar: string;
}

/**
 * The fixed categories, in display order (REQ-002). The original five come first so
 * existing data and habits keep their place; "Other" is always last.
 */
export const CATEGORIES: readonly Category[] = [
  { id: 'food', label: 'Food', icon: '🍜', colorVar: '--c-food' },
  { id: 'education', label: 'Education', icon: '📚', colorVar: '--c-education' },
  { id: 'charity', label: 'Charity', icon: '🤝', colorVar: '--c-charity' },
  { id: 'sport', label: 'Sport', icon: '🏸', colorVar: '--c-sport' },
  { id: 'living', label: 'Living cost', icon: '🏠', colorVar: '--c-living' },
  { id: 'children', label: 'Children', icon: '🧸', colorVar: '--c-children' },
  { id: 'travel', label: 'Travel', icon: '✈️', colorVar: '--c-travel' },
  { id: 'coffee', label: 'Coffee', icon: '☕', colorVar: '--c-coffee' },
  { id: 'fuel', label: 'Fuel', icon: '⛽', colorVar: '--c-fuel' },
  { id: 'electricity', label: 'Electricity', icon: '⚡', colorVar: '--c-electricity' },
  { id: 'grab', label: 'Grab fee', icon: '🛵', colorVar: '--c-grab' },
  { id: 'water', label: 'Water', icon: '💧', colorVar: '--c-water' },
  { id: 'internet', label: 'Internet & phone', icon: '📶', colorVar: '--c-internet' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', colorVar: '--c-shopping' },
  { id: 'health', label: 'Health', icon: '💊', colorVar: '--c-health' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', colorVar: '--c-entertainment' },
  { id: 'other', label: 'Other', icon: '📦', colorVar: '--c-other' },
];

export const CATEGORY_IDS: readonly CategoryId[] = CATEGORIES.map((c) => c.id);

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && (CATEGORY_IDS as readonly string[]).includes(value);
}

export function getCategory(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id)!;
}
