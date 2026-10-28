# Milestone M2: Record expenses: add, list, edit, delete

| | |
|---|---|
| Status | ✅ Done |
| Goals | 3/3 done |
| Completed | 2026-10-28 |

## Delivered
- Add an expense with validation and a confirmation toast (REQ-001, REQ-002, REQ-013).
- Browse expenses month by month, newest first, with a category filter, deep links and an empty state (REQ-005, REQ-017 at mobile width).
- Edit and delete expenses, with a confirmation dialog (REQ-003, REQ-004).

## Goals
| Goal | Result | Attempts | Report |
|---|---|---|---|
| M2-G1 | ✅ | 1 | [report](M2-G1.md) |
| M2-G2 | ✅ | 1 | [report](M2-G2.md) |
| M2-G3 | ✅ | 1 | [report](M2-G3.md) |

## Requirement coverage after this milestone
| REQ | Status |
|---|---|
| REQ-001, 002, 003, 004, 005 | Done (UI and e2e) |
| REQ-013 | Display done; settings UI in M5 |
| REQ-017, 018 | Partly done; full checks in M5-G3 |
| REQ-006–012, 014–016, 019 | Upcoming milestones |

## How to see it
```
npm run dev   # open http://localhost:5173, tap "+ Add expense", then tap a row to edit or delete it
npm test && npm run test:e2e
```

## Risks, debt & notes for next milestone
- Assert per-category totals after an edit on the Summary page (M3-G2).
- Make ConfirmDialog ids unique when Recurring adds a second dialog.
