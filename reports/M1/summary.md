# Milestone M1: Walking skeleton: app shell, domain core, storage

| | |
|---|---|
| Status | ✅ Done |
| Goals | 3/3 done |
| Completed | 2026-10-28 |

## Delivered
- The app opens with the Ledger shell: a top nav on desktop, a tab bar and "+" button on mobile, and every route in place (REQ-017, partial).
- Domain core: the five fixed categories, exact integer money parsing and formatting in the chosen currency, date helpers, and validation (REQ-001, REQ-002, REQ-013, REQ-019, foundations).
- Local storage in IndexedDB with repositories, a request for persistent storage, and a clear notice when storage is unavailable (REQ-014, REQ-005 and REQ-015 data parts).

## Goals
| Goal | Result | Attempts | Report |
|---|---|---|---|
| M1-G1 | ✅ | 1 | [report](M1-G1.md) |
| M1-G2 | ✅ | 1 | [report](M1-G2.md) |
| M1-G3 | ✅ | 1 | [report](M1-G3.md) |

## Requirement coverage after this milestone
| REQ | Status |
|---|---|
| REQ-001, 002, 013, 019 | Domain logic done; UI in M2 |
| REQ-005, 014, 015 | Data layer done; UI and benchmarks later |
| REQ-017 | Shell responsive; content layouts later |
| Others | Not started |

## How to see it
```
npm install
npm run dev        # http://localhost:5173
npm test           # 64 unit tests
npm run test:e2e   # smoke + persistence
```

## Risks, debt & notes for next milestone
- Tighten `guard()` so a native IndexedDB NotFoundError isn't reported as a missing record.
- Keep the 360 px no-horizontal-scroll checks running once real content lands, and add the ≥ 1024 px two-column checks.
