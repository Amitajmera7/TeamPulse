# Review Checklist

- [ ] Architecture
- [ ] Pipeline
- [ ] Ownership Matrix
- [ ] Sequence Diagram
- [ ] Failure Scenarios
- [ ] Atomic Batch Rules
- [ ] Batch Lifecycle
- [ ] No DB / runtime implementation
- [ ] Build Passes

# 1 Objective

Design the **Warehouse Integration Architecture** (Sprint 5A Milestone 12B): how TeamPulse transitions from **Jira-driven analytics** to **Warehouse-driven analytics**.

Architecture only — no PostgreSQL, ORM, SQL, repository implementations, or runtime/orchestrator/engine changes.

# 2 Pipeline

Target future runtime:

```
Jira
  ↓
Resolve Estimates
  ↓
Resolve Worklogs
  ↓
Engineering Warehouse Model
  ↓
Warehouse Validation
  ↓
Atomic Batch Commit
  ↓
Analytics Engine
  ↓
Dashboard Repository
  ↓
React
```

## Integration principles

1. Analytics engines read **only** from the Engineering Analytics Warehouse — never Jira.
2. Jira is **ingest only**.
3. Each sync creates one immutable Batch (`batchId`).
4. Warehouse writes are **atomic** (complete batch or nothing).
5. Dashboard reads the latest **Completed** batch only — never partial writes.

# 3 Ownership Matrix

| Stage | Input | Output | Owner | Failure behavior |
|-------|-------|--------|-------|------------------|
| Jira fetch | Sync trigger / window | Raw issues + worklogs | Orchestrator ingest | Abort; no commit; keep prior Completed |
| Resolve Estimates | Raw issues | Estimate facts | Estimate resolver (ingest helper) | Abort; no warehouse write |
| Resolve Worklogs | Estimate-resolved issues | Worklog facts | Worklog resolver (ingest helper) | Abort; no warehouse write |
| Engineering Warehouse Model | Resolved facts + `batchId` | In-memory SyncBatch + children | EAW model builder (future) | Abort; nothing persisted |
| Warehouse Validation | In-memory model | Validated model or errors | EAW validation | Abort; no Completed batch |
| Atomic Batch Commit | Validated model | Completed batch + facts | Warehouse unit-of-work (future PG) | Full rollback; dashboard unchanged |
| Analytics Engine | Latest Completed batch facts | Profiles / scores (compute) | Analytics engines | No warehouse write; keep prior presentation |
| Dashboard Repository | Projection for Completed batch | `DashboardData` | Dashboard Repository | Safe empty / prior; never partial batch |
| React | `DashboardData` | UI | Dashboard page | Render repository output only |

# 4 Sequence Diagram

```
API Sync → Orchestrator
  → Fetch Jira
  → Resolve Estimates / Worklogs
  → Build warehouse model
  → Validate
  → BEGIN / save batch+children / COMMIT Completed
  → Engines read Completed batch from EAW (not Jira)
  → Publish presentation for Dashboard Repository

GET Dashboard → Repository → latest Completed only → React
```

On failure before COMMIT: previous Completed batch remains the sole analytics/UI source.

# 5 Failure Scenarios

| Scenario | Warehouse | Dashboard source |
|----------|-----------|------------------|
| Jira / resolve / model / validation failure | Unchanged | Previous Completed |
| Atomic commit failure | Rolled back | Previous Completed |
| Engine failure after successful commit | New Completed exists | Keep prior presentation until successful recompute (future analytics-only replay on same `batchId`) |
| Dashboard read failure | Unchanged | Empty / safe fallback |

**Invariant:** Failed or incomplete sync never becomes the dashboard’s Completed source of truth.

# 6 Atomic Batch Rules

1. One unit of work = SyncBatch + all child facts for `batchId`.
2. Status becomes `Completed` only after all children are durable in the same transaction.
3. Any write failure → full rollback; no orphans.
4. Readers may consume only `Completed` batches.
5. Failed attempt → retry with a **new** `batchId` (preferred), not silent mutation of Failed → Completed.

# 7 Batch Lifecycle

```
create batchId → Running (not dashboard-readable)
       │
       ├─ success → Completed (immutable; engines + dashboard may read)
       │
       └─ failure → Failed (no Completed publish; prior Completed kept)
```

Retention (from 12A): delete batch + children after one year.

# 8 Files Created

| File | Purpose |
|------|---------|
| `docs/Warehouse-Integration-Architecture.md` | Integration architecture (pipeline, ownership, lifecycle, failures, PG mapping, incremental sync) |
| `docs/reviews/milestone-12B-review.md` | This review package |

# 9 Files Modified

| File | Change |
|------|--------|
| `docs/reviews/README.md` | Link Warehouse Integration Architecture + milestone-12B review |
| `docs/Glossary.md` | Warehouse-driven analytics / integration term (brief) |

# 10 Files Explicitly Not Modified

- Orchestrator implementation
- Analytics engines
- Dashboard / snapshot runtime
- No PostgreSQL, ORM, SQL, repository implementations
- No EAW entity code changes required for 12B (entities remain 12A)

# 11 Build Output

```
> teampulse@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 5.7s
  Running TypeScript ...
  Finished TypeScript in 6.6s ...
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
✓ Generating static pages using 7 workers (15/15) in 675ms
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

# 12 Self Review

**Rating: 9 / 10**

## Strengths

- Clear cutover contract: engines ← EAW only; Jira ← ingest only.
- Atomic Completed batch aligns with dashboard safety and prior 11A “don’t publish on failure” philosophy.
- Ownership matrix makes stage boundaries reviewable before implementation.

## Known limitations

- Documentation only — current runtime still Jira→engines until a later milestone implements commit + read-path cutover.
- Incremental sync is high-level only (watermark / window rebuild TBD).
- “Analytics-only replay” after commit+engine failure is sketched, not fully designed.
- Live SyncState vs warehouse SyncBatch duality remains; SyncStateProvider still future work.
- Latest-Completed pointer vs `ORDER BY completed_at` left as an implementation choice for PostgreSQL.

## Future implementation plan (not 12B)

1. Implement EAW repositories + transactional commit.
2. Wire orchestrator to build/validate/commit warehouse model.
3. Switch analytics engines to `findByBatch(latestCompleted)`.
4. Remove Jira clients from engine read path.
5. Point Dashboard Repository at analytics derived from Completed batch only.
6. Add retention job and optional incremental ingest.
