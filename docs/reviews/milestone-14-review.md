# Review Checklist

- [ ] Runtime Flow
- [ ] Validation Integration
- [ ] Transaction Flow
- [ ] Rollback Behaviour
- [ ] Logging
- [ ] Dashboard unchanged
- [ ] Build Passes

# 1 Objective

Sprint **5C – Production Ingestion Pipeline** (Milestone 14): first complete **runtime** integration for the Engineering Analytics Warehouse.

Connect the orchestrator to:

1. Build the EAW model  
2. Validate  
3. On FAIL → abort, no PostgreSQL writes  
4. On PASS → atomic persist of SyncBatch + Issues + Allocations + Worklogs  

Do **not** change analytics formulas, Developer/Technology Profile engines, Dashboard Repository, or React UI. Dashboard continues on the existing snapshot path.

# 2 Runtime Flow

```
Fetch Jira
  → Resolve Estimates
  → Resolve Worklogs
  → Build EAW Model
  → Validate EAW
       ├─ FAIL → abort sync (no PG write, no snapshot publish)
       └─ PASS → Persist EAW (single PG transaction)
  → Build Developer Profiles
  → Build Technology Profiles
  → Build DashboardData
  → Build Snapshot
  → Publish Snapshot (existing in-memory path)
  → Dashboard Repository / React (unchanged)
```

Progress steps now include `Build EAW Model`, `Validate EAW`, `Persist EAW` (11 total pipeline steps).

# 3 Files Modified / Created

## Created

| File | Purpose |
|------|---------|
| `src/services/orchestrator/build-eaw-model.ts` | Map Jira + resolution records → `EngineeringWarehouseModel` |
| `src/services/orchestrator/persist-eaw-batch.ts` | Atomic PG persist via `withWarehouseTransaction` |
| `docs/reviews/milestone-14-review.md` | This review package |

## Modified

| File | Change |
|------|--------|
| `src/services/orchestrator/run-analytics-sync.ts` | Wire build → validate → persist; extend result with `eawBatchId` / `eawPersisted` |
| `src/services/orchestrator/sync-state.ts` | New sync steps for EAW stages |
| `src/services/orchestrator/index.ts` | Export EAW build/persist helpers |
| `src/app/api/sync/route.ts` | Return `eawBatchId` / `eawPersisted` |
| `docs/reviews/README.md` | Link milestone-14 review |

## Explicitly unchanged

- Analytics engines / formulas  
- Developer Profile Engine  
- Technology Profile Engine  
- Dashboard Repository  
- React dashboard UI  

# 4 Validation Integration

- Runs **after** `buildEngineeringWarehouseModel` and **before** any DB write.
- Uses `validateEngineeringWarehouseModel` (Milestone 13B).
- On `status === "FAIL"`: throws with error count + sample codes → `failSyncState`; `persistEngineeringWarehouseBatch` is never called.
- Logs full validation summary text.

# 5 Transaction Flow

```typescript
await withWarehouseTransaction(async (tx) => {
  const repos = createPostgresWarehouseRepositories(tx);
  await repos.syncBatches.saveBatch(syncBatch);
  await repos.issues.saveBatch(batchId, issues);
  await repos.allocations.saveBatch(batchId, allocations);
  await repos.worklogs.saveBatch(batchId, worklogs);
});
```

- One BEGIN / COMMIT for the full batch.
- Repository interfaces unchanged; implementations receive the transaction client.
- Requires `DATABASE_URL` (pool created on first persist).

# 6 Rollback Behaviour

| Failure | PostgreSQL | Snapshot publish | SyncState |
|---------|------------|------------------|-----------|
| Validation FAIL | No write attempted | No | Failed |
| Persist / query error | ROLLBACK entire unit | No | Failed |
| Later profile/snapshot error | EAW batch already committed | No | Failed |
| Full success | COMMIT | Yes | Completed |

No partial EAW batches: either all four entity sets commit or none.

# 7 Logging

Prefix `[EAW]`:

| Stage | Example |
|-------|---------|
| Build | `[EAW] Build EAW starting` / `… complete batchId=… issues=…` |
| Validate | `[EAW] Validate EAW PASS` + summary block |
| Persist | `[EAW] Persist EAW starting batchId=…` |
| Commit | `[EAW] Commit Success batchId=…` |
| Rollback | `[EAW] Rollback batchId=… reason=…` |

# 8 Example Successful Sync Log

```text
[EAW] Build EAW starting
[EAW] Build EAW complete batchId=8f3c2a1e-… issues=2478 allocations=512 worklogs=7454
[EAW] Validate EAW starting
[EAW] Validate EAW PASS
Validation Summary

PASS

Issues

2478

Worklogs

7454

Allocations

512

Errors

0

Warnings

0
[EAW] Persist EAW starting batchId=8f3c2a1e-… issues=2478 allocations=512 worklogs=7454
[EAW] Commit Success batchId=8f3c2a1e-…
```

API success payload includes `eawPersisted: true`, `eawBatchId: "…"`, `snapshotPublished: true`.

# 9 Example Failed Validation Log

```text
[EAW] Build EAW starting
[EAW] Build EAW complete batchId=… issues=10 allocations=2 worklogs=3
[EAW] Validate EAW starting
[EAW] Validate EAW FAIL
Validation Summary

FAIL

Issues

10

Worklogs

3

Allocations

2

Errors

2

Warnings

0
```

Sync returns `success: false`, `eawPersisted: false`, error like:

`EAW validation failed (2 errors). CROSS_ALLOCATION_WORKLOG_HOURS: …`

No `[EAW] Persist EAW` / Commit lines.

# 10 Build Output

```
> teampulse@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 6.9s
  Running TypeScript ...
  Finished TypeScript in 6.3s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/15) ...
The width(-1) and height(-1) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(-1) and height(-1) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
  Generating static pages using 7 workers (3/15) 
  Generating static pages using 7 workers (7/15) 
  Generating static pages using 7 workers (11/15) 
✓ Generating static pages using 7 workers (15/15) in 731ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /ai
├ ○ /analytics
├ ƒ /api/contribution
├ ƒ /api/leaderboard
├ ƒ /api/metrics
├ ƒ /api/sync
├ ○ /dashboard
├ ○ /developers
├ ○ /leaderboard
├ ○ /settings
└ ○ /teams


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

Exit code: 0
```

# 11 Self Review

**Rating: 8.5 / 10**

## Strengths

- Validation gate before any PG write  
- Single-transaction persist; clear Commit/Rollback logs  
- Dashboard path untouched  

## Known limitations

- Schema must already be applied (`001_initial.sql`); app does not migrate  
- Missing/invalid `DATABASE_URL` fails at Persist (after PASS validation)  
- Worklogs use deterministic `fact:` keys until Jira worklog ids are carried on TaskWorklog  
- If profiles/snapshot fail after EAW commit, warehouse has a Completed batch while sync reports Failed — acceptable for facts-first ingest; document for operators  
- `/dashboard` remains static / in-memory snapshot (out of scope)

---

Waiting for architecture review.
