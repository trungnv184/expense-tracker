# Milestone M3: Monthly summary, chart and budgets

| | |
|---|---|
| Status | ✅ Done |
| Goals | 3/3 done |
| Completed | 2026-10-28 |

## Delivered
- Monthly summary: the total, all five categories, a donut chart and an empty state (REQ-006, REQ-007).
- A budget per category, with ok, warning (≥ 80%) and over (> 100%) states written out in words (REQ-008, REQ-009).
- At ≥ 1024 px the summary and the expense list use two columns (REQ-017).

## Goals
| Goal | Result | Attempts | Report |
|---|---|---|---|
| M3-G1 | ✅ | 1 | [report](M3-G1.md) |
| M3-G2 | ✅ | 1 | [report](M3-G2.md) |
| M3-G3 | ✅ | 1 | [report](M3-G3.md) |

## Requirement coverage after this milestone
| REQ | Status |
|---|---|
| REQ-001–009 | Done |
| REQ-019 | Domain and summary invariant done; final check in M5-G3 |
| REQ-017 | Two-column layouts done; full sweep in M5-G3 |
| REQ-010–016, 018 | M4 and M5 |

## How to see it
```
npm run dev   # Summary tab: chart and budgets; Budgets tab: set limits; widen the window past 1024 px for two columns
```

## Risks, debt & notes for next milestone
- M4-G1 and M5-G1 were started in parallel worktrees; merge them in dependency order.
