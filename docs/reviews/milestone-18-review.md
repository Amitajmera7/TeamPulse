# Review Checklist

- [ ] Sync History page (`/operations/history`)
- [ ] Batch Explorer (`/operations/history/[batchId]`)
- [ ] History APIs
- [ ] Persistence-first + in-memory fallback
- [ ] Pagination-ready architecture
- [ ] No analytics formula / EAW schema / engine / dashboard redesign changes
- [ ] Build Passes

# 1 Objective

Sprint **7B – Sync History & Batch Explorer** (Milestone 18).

Provide operational history for every TeamPulse sync — list previous runs and inspect a single batch — **without changing analytics formulas, Engineering Analytics Warehouse schema, Developer Profile Engine, or Engineering Dashboard redesign**.

# 2 Architecture

```
┌──────────────────────────────────────────────────────────┐
│  operations-history service                              │
│  listSyncHistory / getSyncHistoryDetail                  │
├──────────────────────────────────────────────────────────┤
│  Warehouse (optional)     │  In-memory ring buffer       │
│  sync_batch via           │  pushSyncRunHistory on each  │
│  SyncBatchRepository      │  recordLastSyncSummary       │
│  findRecent / findByBatch │  (failed runs + logs)        │
└────────────┬──────────────┴──────────────┬───────────────┘
             │  merge by historyId         │
             │  (memory wins on collision) │
             ▼                             ▼
   GET /api/operations/history    GET /api/operations/history/{batchId}
             │                             │
             ▼                             ▼
   /operations/history            /operations/history/[batchId]
   SyncHistoryTable               Batch Explorer
```

- Reuses `LastSyncSummary` fields via `SyncHistoryEntry` (no duplicated business logic).
- Warehouse schema unchanged; only repository method `findRecent(limit, offset)` added (SQL read).

# 3 History Flow

1. Sync completes → `recordLastSyncSummary` → `pushSyncRunHistory` (in-memory, newest first, cap 50).
2. Successful EAW persist continues to write `sync_batch` (existing Milestone 14 path).
3. History list:
   - If `DATABASE_URL` works → load recent warehouse batches.
   - Always load in-memory history.
   - Merge / dedupe by `historyId` (prefer memory for richer ops fields).
   - Sort newest first; apply `offset` / `limit`.
4. If warehouse unavailable → in-memory-only fallback (`source: "memory"`).

# 4 API Contract

### `GET /api/operations/history?limit=&offset=`

```json
{
  "success": true,
  "entries": [
    {
      "historyId": "…",
      "entrySource": "warehouse" | "memory",
      "success": true,
      "syncStatus": "Completed",
      "startedAt": "…",
      "completedAt": "…",
      "durationMs": 1234,
      "issuesProcessed": 10,
      "worklogsProcessed": 20,
      "eawBatchId": "…",
      "validationStatus": "PASS",
      "warehouseStatus": "Persisted",
      "analyticsStatus": "Published",
      "logLines": []
    }
  ],
  "pagination": {
    "limit": 25,
    "offset": 0,
    "total": 1,
    "hasMore": false
  },
  "source": "merged" | "warehouse" | "memory",
  "warehouseAvailable": true
}
```

### `GET /api/operations/history/{batchId}`

**200**

```json
{
  "success": true,
  "entry": { "/* SyncHistoryEntry */": true },
  "source": "merged",
  "warehouseAvailable": true,
  "verificationReport": "Verification Report\\n…",
  "pipelineSteps": ["Fetch Jira", "…"]
}
```

**404** → `{ "success": false, "error": "Sync history entry not found." }`

# 5 Pages

| Route | UI |
|-------|-----|
| `/operations/history` | Table: Started, Completed, Duration, Status, Issues, Worklogs, Validation, Warehouse, Analytics, Batch ID + Previous/Next |
| `/operations/history/[batchId]` | Summary, Processing Counts, Validation Summary, Pipeline Timeline, Verification Report, Runtime Logs |

# 6 Files Created

| File | Purpose |
|------|---------|
| `src/services/orchestrator/sync-run-history.ts` | In-memory history ring buffer |
| `src/services/operations-history/types.ts` | History DTOs + pagination |
| `src/services/operations-history/map-history-entry.ts` | SyncBatch / LastSyncSummary → entry |
| `src/services/operations-history/list-sync-history.ts` | Merge + paginate |
| `src/services/operations-history/get-sync-history-detail.ts` | Batch detail |
| `src/services/operations-history/format-verification-report.ts` | Derived report text |
| `src/services/operations-history/index.ts` | Public exports |
| `src/app/api/operations/history/route.ts` | List API |
| `src/app/api/operations/history/[batchId]/route.ts` | Detail API |
| `src/app/(dashboard)/operations/history/page.tsx` | History page |
| `src/app/(dashboard)/operations/history/[batchId]/page.tsx` | Batch Explorer page |
| `src/components/operations/sync-history-table.tsx` | History table |
| `src/components/operations/sync-history-view.tsx` | History client shell |
| `src/components/operations/batch-explorer.tsx` | Batch Explorer UI |
| `docs/reviews/milestone-18-review.md` | This review package |

# 7 Files Modified

| File | Change |
|------|--------|
| `src/services/orchestrator/last-sync-summary.ts` | Push to history buffer on record |
| `src/services/orchestrator/index.ts` | Export history helpers |
| `src/services/engineering-warehouse/repositories/sync-batch-repository.ts` | `findRecent` |
| `src/services/engineering-warehouse/persistence/repositories/sync-batch-postgres.ts` | `findRecent` SQL |
| `src/components/operations/operations-actions.tsx` | Enable View Sync History → `/operations/history` |
| `src/config/navigation.ts` | `history` route label |
| `docs/reviews/README.md` | Link milestone-18 |
| `docs/Glossary.md` | Sync History & Batch Explorer term |

# 8 Runtime Behaviour

| Scenario | Behaviour |
|----------|-----------|
| DB configured + sync_batch rows | History from warehouse; memory enriches overlapping ids |
| DB missing / query fails | In-memory fallback only |
| Failed sync (never persisted) | Appears from memory buffer until process restart |
| Pagination | `limit`/`offset` on API; Previous/Next on UI |
| Batch link | Encoded `historyId` → Batch Explorer |

# 9 Backward Compatibility

| Concern | Status |
|---------|--------|
| Analytics formulas | Unchanged |
| EAW DDL / schema | Unchanged |
| Developer Profile Engine | Unchanged |
| Engineering Dashboard UI | Unchanged |
| Existing `/operations` | Unchanged except History button enabled |
| `GET /api/operations` | Unchanged |
| `POST /api/sync` | Unchanged (still records last summary; now also history buffer) |

# 10 Screenshots

Screenshots not captured in this agent session. Manual capture after `npm run dev`:

1. `/operations/history` — empty then populated table
2. Pagination controls with multiple runs
3. `/operations/history/[batchId]` — Batch Explorer sections
4. Operations Actions → View Sync History navigation

# 11 Build Output

```
> teampulse@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 5.3s
  Running TypeScript ...
  Finished TypeScript in 5.7s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/17) ...
  Generating static pages using 7 workers (4/17) 
  Generating static pages using 7 workers (8/17) 
  Generating static pages using 7 workers (12/17) 
✓ Generating static pages using 7 workers (17/17) in 416ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /ai
├ ○ /analytics
├ ƒ /api/contribution
├ ƒ /api/dashboard
├ ƒ /api/leaderboard
├ ƒ /api/metrics
├ ƒ /api/operations
├ ƒ /api/operations/history
├ ƒ /api/operations/history/[batchId]
├ ƒ /api/sync
├ ƒ /dashboard
├ ○ /developers
├ ○ /leaderboard
├ ƒ /operations
├ ƒ /operations/history
├ ƒ /operations/history/[batchId]
├ ○ /settings
└ ○ /teams


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

Exit code: 0
```

# 12 Self Review

**Rating: 9 / 10**

## Strengths

- Clear persistence-first / memory-fallback merge without EAW schema change  
- Reuses `LastSyncSummary` + existing timeline/logs components  
- Pagination-ready (`limit`/`offset`/`hasMore`)  
- Batch Explorer covers all requested panels  

## Known limitations

- Failed runs remain process-local only (never written to `sync_batch`)  
- Warehouse rows lack logs / analytics published flag → inferred or Unknown  
- Verification report is derived from ops outcome (not full Runtime Verification harness)  
- In-memory history lost on restart / multi-instance  

## Next

Durable sync-run audit store (outside EAW facts) for failures + logs; wire Download Verification Report to `runRuntimeVerification()`.

---

Waiting for architecture review.
