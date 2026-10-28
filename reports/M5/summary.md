# Milestone M5: Settings, export, offline and quality gates

| | |
|---|---|
| Status | ✅ Done |
| Goals | 3/3 done |
| Completed | 2026-10-28 |

## Delivered
- Settings: currency selection with a live preview, CSV export and the "Your data" notice (REQ-012, REQ-013, REQ-014).
- Works offline after the first load (service worker), with a strict CSP and no user data sent over the network (REQ-016).
- Checked performance with 5,000 expenses (REQ-015), responsive layouts (REQ-017), axe accessibility checks and keyboard use (REQ-018), and exact money totals (REQ-019).

## Goals
| Goal | Result | Attempts | Report |
|---|---|---|---|
| M5-G1 | ✅ | 1 | [report](M5-G1.md) |
| M5-G2 | ✅ | 1 (re-verified after an environment incident) | [report](M5-G2.md) |
| M5-G3 | ✅ | 1 | [report](M5-G3.md) |

## Requirement coverage after this milestone
| REQ | Status |
|---|---|
| REQ-001 – REQ-019 | All done |

## How to see it
```
npm run build && npm run preview   # http://localhost:4173, works offline after the first visit
npm run verify
```

## Risks, debt & notes for next milestone
- Little headroom on the save-timing test on slow CI machines.
