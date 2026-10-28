# Execution Plan: Ledger (Expense Tracker)

| | |
|---|---|
| Status | Approved design → ready to execute |
| Source | docs/01-prd.md, docs/03-solution-design.md |
| Machine-readable | .flow/plan.json |

## Milestones

| Milestone | Demo after it | Goals |
|---|---|---|
| M1 | Walking skeleton: app shell, domain core, storage | M1-G1, M1-G2, M1-G3 |
| M2 | Record expenses: add, list, edit, delete | M2-G1, M2-G2, M2-G3 |
| M3 | Monthly summary, chart and budgets | M3-G1, M3-G2, M3-G3 |
| M4 | Recurring expenses | M4-G1, M4-G2 |
| M5 | Settings, export, offline and quality gates | M5-G1, M5-G2, M5-G3 |

## M1: Walking skeleton: app shell, domain core, storage

### M1-G1: Scaffold Vite + React + TS app with tooling, design tokens and AppShell routes
- **REQs**: REQ-017
- **Depends on**: —
- **Acceptance**:
  - npm scripts exist: dev, build, preview, test (vitest run), test:e2e (playwright test), typecheck, lint, verify (typecheck && lint && test && test:e2e)
  - src/styles/tokens.css and base.css are ported from docs/02-mockups/styles.css
  - AppShell renders top nav at >= 768px and bottom tab bar at < 768px with links to Expenses, Summary, Budgets, Recurring, Settings (hash routes from design §5)
  - Each route renders a placeholder page heading; a Playwright smoke spec visits every route at 360px and 1280px with no horizontal scroll
  - npm run build succeeds
- **Verify**:
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
  - `npm run build`
  - `npx playwright test e2e/smoke.spec.ts`
- **Notes**: Design §1 (stack), §5 Routes, §7 Project layout. Mockups: docs/02-mockups/expenses.html for shell (topbar, tabbar, FAB). Install Playwright browsers (chromium, webkit) with npx playwright install. Playwright webServer runs vite preview after build.

### M1-G2: Add domain modules: categories, money parsing/formatting, dates and validation
- **REQs**: REQ-001, REQ-002, REQ-013, REQ-019
- **Depends on**: M1-G1
- **Acceptance**:
  - CATEGORIES lists exactly food, education, charity, sport, living in that order with labels Food, Education, Charity, Sport, Living cost, an icon and a colour token
  - parseAmount('12.50') -> 1250; '', '0', '-4', 'abc', '1.555' are rejected with required/not_positive/not_number/too_many_decimals
  - formatAmount(1250,'USD') -> '$12.50'; formatAmount(5000000,'VND') renders 50.000 with the dong sign and no decimals
  - Summing parsed 0.10 and 0.20 and formatting gives '$0.30'
  - validateExpense rejects missing category, invalid amount, invalid date and note > 200 chars with per-field errors
  - validateBudget and validateRecurring (day 1..31, startMonth YYYY-MM) behave per design §5
  - Domain modules have no imports from data or ui
- **Verify**:
  - `npx vitest run src/domain`
  - `npm run typecheck`
- **Notes**: Design §5 Domain, §7 domain/money, ADR-002 (integer hundredths, string parsing — never parseFloat*100). dates.ts: local YYYY-MM-DD helpers, monthOf, addMonths, daysInMonth.

### M1-G3: Add Dexie database, repositories and bootstrap with storage-unavailable handling
- **REQs**: REQ-014, REQ-005, REQ-015
- **Depends on**: M1-G2
- **Acceptance**:
  - Dexie schema v1 matches design §4 (expenses indexed by id, month, date, category, recurringId; budgets by category; recurring by id, active; settings by key)
  - expensesRepo add/update/remove/get/byMonth/all work against fake-indexeddb; byMonth returns date desc then createdAt desc; update recomputes month
  - budgetsRepo set/clear/all, settingsRepo get/setCurrency (default USD) work
  - Repository failures surface as StorageError; missing ids as NotFound
  - Bootstrap opens the DB, calls navigator.storage.persist() when available, and renders a StorageUnavailable notice when opening fails
  - Data written in one page load is present after reload (Playwright)
- **Verify**:
  - `npx vitest run src/data`
  - `npm run typecheck`
  - `npx playwright test e2e/persistence.spec.ts`
- **Notes**: Design §4 Data model, §5 Data repositories, §6.6 (boot branch only; recurring generation comes in M4), §7 Error handling. Use fake-indexeddb/auto in vitest setup.

## M2: Record expenses: add, list, edit, delete

### M2-G1: Build the add-expense form with category picker, amount input and validation
- **REQs**: REQ-001, REQ-002, REQ-013, REQ-018
- **Depends on**: M1-G3
- **Acceptance**:
  - Given the add form, when amount 12.50, category Food are entered and saved, then an expense dated today appears and toast 'Expense saved' shows
  - Empty, 0, negative or >2-decimal amounts block saving with an inline error next to the amount; missing category blocks saving with an inline error
  - Date defaults to today; note limited to 200 chars
  - Category picker is a radio group offering exactly the five categories in order, operable by keyboard
  - Currency symbol in AmountInput comes from settings
  - On StorageError the form keeps its values and shows an error banner
- **Verify**:
  - `npx vitest run src/ui`
  - `npm run typecheck`
  - `npx playwright test e2e/add-expense.spec.ts`
- **Notes**: Design §6.1, §7 UI pages. Mockup: docs/02-mockups/add-expense.html (both states). Components: CategoryPicker, CategoryBadge, AmountInput, Toast, useCurrency.

### M2-G2: Build the monthly expense list with month navigation, category filter and empty state
- **REQs**: REQ-005, REQ-002, REQ-013, REQ-017
- **Depends on**: M2-G1
- **Acceptance**:
  - Home shows the current month's expenses grouped by date, newest first, with month total
  - Given expenses in October and September, when on October and pressing previous month, then only September's expenses show sorted by date desc
  - Filtering by Education shows only Education expenses of that month; clearing shows all; ?cat= deep link applies the filter
  - A month with no expenses shows an empty state with an Add expense action
  - Month and filter live in the URL (?month=YYYY-MM&cat=)
  - Layout has no horizontal scroll at 360px
- **Verify**:
  - `npx vitest run src/ui`
  - `npm run typecheck`
  - `npx playwright test e2e/expense-list.spec.ts`
- **Notes**: Mockups: expenses.html, expenses-empty.html. Design §7 UI pages (useLiveQuery, URL state), MonthNav, EmptyState. Budget at-a-glance panel comes in M3-G3.

### M2-G3: Add editing and deleting expenses with confirmation dialog
- **REQs**: REQ-003, REQ-004
- **Depends on**: M2-G2
- **Acceptance**:
  - Tapping a row opens the edit form prefilled; editing 10.00 Food to 15.00 Sport and saving updates the row and month totals
  - Edit uses the same validation as add
  - Delete shows a confirmation dialog; confirm removes the expense and updates totals, cancel changes nothing
  - Opening a non-existent expense id shows 'Expense no longer exists' and returns to the list
- **Verify**:
  - `npx vitest run src/ui`
  - `npm run typecheck`
  - `npx playwright test e2e/edit-delete.spec.ts`
- **Notes**: Design §6.2. Mockup: edit-expense.html. ConfirmDialog uses native <dialog> showModal().

## M3: Monthly summary, chart and budgets

### M3-G1: Implement month summary and budget status calculations
- **REQs**: REQ-006, REQ-009, REQ-019
- **Depends on**: M1-G2
- **Acceptance**:
  - summarizeMonth of Food 10.00, Food 5.00, Sport 20.00 returns Food 1500, Sport 2000, Education/Charity/Living 0, total 3500
  - Total always equals the sum of category totals and of the input rows (randomised test)
  - budgetStatus: 120/300 -> ok 40% 180.00 left; 250/300 -> warn 83%; 330/300 -> over by 30.00; no budget -> none
- **Verify**:
  - `npx vitest run src/domain/summary`
- **Notes**: Design §5 summary.ts, §7 domain/summary.

### M3-G2: Build the Summary page with category totals, donut chart and budget bars
- **REQs**: REQ-006, REQ-007, REQ-009, REQ-017
- **Depends on**: M3-G1, M2-G2
- **Acceptance**:
  - Summary for a month shows total and all five categories including zeros
  - Donut chart segments are proportional to category totals and each is labelled with category and amount in the legend; the SVG has an accessible label
  - A month with no expenses replaces the chart with an empty-state message
  - Budget rows show spent, left/over and a progress bar in ok/warn/over state, or 'No budget'; status is written in text, not colour alone
  - Tapping a category navigates to the list filtered by that category and month; month navigation works
  - At >= 1024px totals and budgets sit side by side
- **Verify**:
  - `npx vitest run src/ui`
  - `npm run typecheck`
  - `npx playwright test e2e/summary.spec.ts`
- **Notes**: Design §6.3. Mockups: summary.html, summary-empty.html. Hand-written SVG DonutChart, BudgetBar component.

### M3-G3: Build the Budgets page and the at-a-glance budget panel on the expense list
- **REQs**: REQ-008, REQ-009, REQ-017
- **Depends on**: M3-G2
- **Acceptance**:
  - Setting Food = 300.00 and saving shows a 300.00 Food budget in the current and later months
  - Clearing a budget shows 'No budget' and no progress bar
  - Non-positive or non-numeric values block saving with an inline error; nothing is saved
  - Expenses page shows the budget panel beside the list only at >= 1024px
- **Verify**:
  - `npx vitest run src/ui`
  - `npm run typecheck`
  - `npx playwright test e2e/budgets.spec.ts`
- **Notes**: Design §6.4 (budgets part). Mockups: budgets.html, expenses.html aside.

## M4: Recurring expenses

### M4-G1: Implement recurring due-date calculation and transactional generation
- **REQs**: REQ-010, REQ-011
- **Depends on**: M1-G3
- **Acceptance**:
  - Rent 500.00 Living cost day 1 from 2026-08, generated on 2026-10-28, creates exactly 1 Aug, 1 Sep, 1 Oct expenses with recurringId set
  - Running generateDue again creates nothing
  - Day 31 generates on the last day of February (28 or 29)
  - An occurrence later in the current month than today is not created yet
  - A deleted generated expense is not recreated
  - Editing the amount to 550.00 in October leaves October at 500.00 and creates November at 550.00
  - Stopped definitions generate nothing; existing expenses remain
  - A failure inside the transaction rolls back both inserts and cursor
- **Verify**:
  - `npx vitest run src/domain/recurring src/data`
  - `npm run typecheck`
- **Notes**: Design §4 recurring cursor, §5 recurring.ts and recurringRepo, §6.6, §7 domain/recurring, ADR-003.

### M4-G2: Build Recurring list and form pages and run generation on app open
- **REQs**: REQ-010, REQ-011, REQ-002
- **Depends on**: M4-G1, M2-G2
- **Acceptance**:
  - Bootstrap runs generateDue before first render; a generation failure is logged and the app still renders
  - Recurring page lists definitions with amount, category, day and start; stopped ones are marked
  - Create form validates amount, category, day 1..31, start month; saving backfills due months and shows how many were added
  - Edit form keeps start month read-only and notes changes apply to future months
  - Stop asks for confirmation; after stopping no new expenses are created
  - Generated expenses show a 'Recurring' badge in the list
  - E2E with page.clock fixed to 2026-10-28 reproduces the Rent Aug–Oct example
- **Verify**:
  - `npx vitest run src/ui`
  - `npm run typecheck`
  - `npx playwright test e2e/recurring.spec.ts`
- **Notes**: Design §6.4, §6.6. Mockups: recurring.html, recurring-form.html (?edit mode).

## M5: Settings, export, offline and quality gates

### M5-G1: Build Settings with currency selection and CSV export
- **REQs**: REQ-012, REQ-013, REQ-014, REQ-016
- **Depends on**: M2-G2
- **Acceptance**:
  - Currency select (USD default; VND, EUR, GBP, JPY, ...) shows a preview and re-formats every amount app-wide; stored amounts are unchanged
  - toCsv writes header date,category,amount,note,recurring, rows sorted by date asc, amounts with 2 decimals, RFC 4180 quoting (Lunch, "big" one -> "Lunch, ""big"" one"), UTF-8 BOM, CRLF
  - Export CSV downloads expenses-YYYY-MM-DD.csv with exactly one row per expense; with no expenses only the header
  - Settings shows the 'Your data' notice (local only, offline, export as backup)
- **Verify**:
  - `npx vitest run src/domain/csv src/ui`
  - `npm run typecheck`
  - `npx playwright test e2e/settings.spec.ts`
- **Notes**: Design §6.5, §6.7, §7 domain/csv. Mockup: settings.html.

### M5-G2: Make the app work offline with a service worker and lock down network access
- **REQs**: REQ-016, REQ-014
- **Depends on**: M5-G1
- **Acceptance**:
  - vite-plugin-pwa precaches the build; after first load, with context offline, the add/view/summary/export journey works
  - CSP meta default-src 'self' is set; no external fonts, scripts or analytics
  - During add, edit, view and export, every network request is a same-origin static asset; none carries user data
  - Data persists across reload and a new page in the same browser context
- **Verify**:
  - `npm run build`
  - `npx playwright test e2e/offline.spec.ts e2e/network.spec.ts e2e/persistence.spec.ts`
- **Notes**: Design §8 REQ-016, REQ-014; §1 Offline.

### M5-G3: Add performance, responsive and accessibility checks and pass the full verify
- **REQs**: REQ-015, REQ-017, REQ-018, REQ-019
- **Depends on**: M5-G2, M4-G2, M3-G3, M2-G3
- **Acceptance**:
  - With 5,000 seeded expenses, the month list and summary render in < 1s after navigation; saving an expense updates list and totals in < 200ms
  - Every route at 360px has no horizontal scroll; at 1280px list and budgets (and summary columns) are side by side
  - axe scan of every route reports zero serious or critical violations
  - Add-expense journey completes using keyboard only with a visible focus indicator
  - npm run verify passes
- **Verify**:
  - `npx playwright test e2e/perf.spec.ts e2e/responsive.spec.ts e2e/a11y.spec.ts`
  - `npm run verify`
- **Notes**: Design §8, §9. Seed via e2e/fixtures/seed.ts writing directly into IndexedDB through page.evaluate.

## REQ → goal coverage

| REQ | Goals |
|---|---|
| REQ-001 | M1-G2, M2-G1 |
| REQ-002 | M1-G2, M2-G1, M2-G2, M4-G2 |
| REQ-003 | M2-G3 |
| REQ-004 | M2-G3 |
| REQ-005 | M1-G3, M2-G2 |
| REQ-006 | M3-G1, M3-G2 |
| REQ-007 | M3-G2 |
| REQ-008 | M3-G3 |
| REQ-009 | M3-G1, M3-G2, M3-G3 |
| REQ-010 | M4-G1, M4-G2 |
| REQ-011 | M4-G1, M4-G2 |
| REQ-012 | M5-G1 |
| REQ-013 | M1-G2, M2-G1, M2-G2, M5-G1 |
| REQ-014 | M1-G3, M5-G1, M5-G2 |
| REQ-015 | M1-G3, M5-G3 |
| REQ-016 | M5-G1, M5-G2 |
| REQ-017 | M1-G1, M2-G2, M3-G2, M3-G3, M5-G3 |
| REQ-018 | M2-G1, M5-G3 |
| REQ-019 | M1-G2, M3-G1, M5-G3 |
