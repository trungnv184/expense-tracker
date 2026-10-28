# Final report: Ledger (Expense Tracker)

| | |
|---|---|
| Status | ✅ All 14 goals done, 0 blocked |
| Idea | A tool to keep track of all my expenses: food, education, charity, sport and living cost |
| Completed | 2026-10-28 |
| Docs | [PRD](../docs/01-prd.md) · [Mockups](../docs/02-mockups/index.html) · [Solution design](../docs/03-solution-design.md) · [Plan](../docs/04-plan.md) |

## What was built
Ledger is a private, offline-capable web app (React + TypeScript + Vite). All data stays in the browser's IndexedDB. There is no account and no server.
- **Expenses:** add, edit and delete expenses in five fixed categories: Food, Education, Charity, Sport and Living cost. Money is stored exactly, as integer cents.
- **Monthly list:** month navigation, a category filter and an empty state.
- **Summary:** each month's total, per-category totals and a donut chart.
- **Budgets:** a monthly budget per category with ok, warning (≥ 80%) and over states. On desktop a budget panel sits next to the list.
- **Recurring expenses:** filled in automatically when you open the app, including backfill for past months. There are no duplicates, deleted ones aren't recreated, and day 31 falls back to the month's last day. You can edit them (future months only) or stop them.
- **Settings:** display currency (USD default, plus VND, EUR, GBP, JPY and others) and CSV export.
- **Offline and privacy:** works offline after the first load (service worker) and has a strict Content-Security-Policy. Tests confirm that no user data goes over the network.

## Milestones
| Milestone | Goals | Result | Summary |
|---|---|---|---|
| M1 Walking skeleton | 3/3 | ✅ | [summary](M1/summary.md) |
| M2 Record expenses | 3/3 | ✅ | [summary](M2/summary.md) |
| M3 Summary, chart and budgets | 3/3 | ✅ | [summary](M3/summary.md) |
| M4 Recurring expenses | 2/2 | ✅ | [summary](M4/summary.md) |
| M5 Settings, export, offline and quality | 3/3 | ✅ | [summary](M5/summary.md) |

Every goal passed independent verification on its first attempt.

## Coverage
See [coverage.md](coverage.md). All 19 requirements (18 Must, 1 Should) are covered.

## Quality gates (final `npm run verify`)
- TypeScript strict and ESLint: clean.
- Vitest: 114 unit, integration and component tests.
- Playwright: 95 end-to-end tests. They cover every PRD journey, an axe scan of every route at 360 and 1280 px (zero serious or critical issues), a keyboard-only add journey, no horizontal scroll at 360 px, and the two-column layout at 1280 px.
- Performance with 5,000 expenses: list 118–131 ms, summary 57–87 ms, save → visible 78–150 ms. Targets are < 1 s and < 200 ms.
- Offline journey and network-silence checks pass.

## Decisions made during execution
- The page h1 is the month name on Expenses and Summary, as in the mockups.
- The CSV uses category labels ("Living cost") and `true`/`false` for recurring.
- Recurring generation uses a per-definition cursor in one transaction (ADR-003). If generation fails at startup, the app still renders and generation is retried on the next open.
- The CSP is injected only into production builds, since the dev server needs inline scripts.
- Several goals were built in parallel git worktrees while others were being verified.
  - **Incident:** a symlinked `node_modules` was committed by mistake. Checking out that branch deleted the real `node_modules` and broke a running verifier.
  - **Fix:** the verifier was stopped, the symlink was untracked, `.gitignore` was corrected (`node_modules` without the slash), `npm ci` restored the dependencies, and the goal was re-verified. No source code was affected.

## Known limitations and follow-ups
- Decimals on 0-decimal currencies (VND, JPY) are rounded for display only, so 12.50 shows as "13 ₫". This was accepted in the design.
- The mockup's notice for expenses added at startup isn't shown; you see a count only after creating a recurring definition.
- The browser can clear the data (cleared site data, Safari's 7-day rule). The app requests persistent storage, but export CSV regularly as a backup, or install the app to your home screen.
- A real browser restart with a persistent profile isn't tested (a reload and a new page are).

## How to run it
```bash
cd expense-tracker
npm install
npm run dev          # http://localhost:5173
npm run build && npm run preview   # production build with offline support, http://localhost:4173
npm run verify       # typecheck + lint + unit + e2e
```
