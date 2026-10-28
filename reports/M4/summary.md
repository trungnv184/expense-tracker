# Milestone M4: Recurring expenses

| | |
|---|---|
| Status | ✅ Done |
| Goals | 2/2 done |
| Completed | 2026-10-28 |

## Delivered
- Recurring definitions (rent, tuition and so on) are filled in automatically for every due month when the app opens. There are no duplicates, deleted ones aren't recreated, and day 31 falls back to the month's last day (REQ-010).
- Manage recurring expenses: edit (future months only) and stop with a confirmation (REQ-011).

## Goals
| Goal | Result | Attempts | Report |
|---|---|---|---|
| M4-G1 | ✅ | 1 | [report](M4-G1.md) |
| M4-G2 | ✅ | 1 | [report](M4-G2.md) |

## Requirement coverage after this milestone
| REQ | Status |
|---|---|
| REQ-001–013 | Done |
| REQ-014, 016 | Notice and storage done; offline and network checks in M5-G2 |
| REQ-015, 017, 018, 019 | Final checks in M5-G3 |

## How to see it
```
npm run dev   # Recurring tab: + New recurring, Rent, day 1, start 3 months ago, then Create
```

## Risks, debt & notes for next milestone
- The startup generation count isn't shown in the UI (nice-to-have in the mockup).
