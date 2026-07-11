# Review Checklist

- [ ] Architecture
- [ ] Entities
- [ ] Repositories
- [ ] Relationships
- [ ] Ownership
- [ ] No DB implementation
- [ ] Build Passes

# 1 Objective

Design the **Engineering Analytics Warehouse (EAW)** as the long-term analytics system of record for TeamPulse (Sprint 5A Milestone 12A).

This milestone is **architecture only**:

- TypeScript domain entities
- Repository contracts (interfaces only)
- Documentation

**Do not** connect PostgreSQL, add ORM/Prisma/Drizzle/migrations/SQL, or modify orchestrator, analytics engines, or dashboard.

# 2 Architecture

```
Jira (operational system of record)
        ↓
Analytics Orchestrator          ← unchanged in 12A
        ↓
Engineering Analytics Warehouse ← NEW (facts only, design)
        ↓
Analytics Engines               ← compute derived metrics (not persisted)
        ↓
Analytics Snapshot / Dashboard
```

## Principles enforced by design

1. Jira = operational; EAW = analytics history.
2. **Never** persist derived metrics (Engineering Score, Technology Health, Recovery Score, Quality Score, ranks, bands).
3. Persist **engineering facts** only.
4. Retain **one year** of history.
5. Every sync has a unique **Batch ID**.

# 3 Entity Diagram

```
┌─────────────────────────────┐
│         SyncBatch           │
│  batchId (PK)               │
│  startedAt / completedAt    │
│  durationMs / status        │
│  issuesProcessed            │
│  worklogsProcessed          │
│  warehouseSchemaVersion     │
└─────────────┬───────────────┘
              │ 1
              │ batchId
              │
     ┌────────┼────────────────────────┐
     │        │                        │
     ▼ *      ▼ *                      ▼ *
┌──────────────┐  ┌────────────────────┐  ┌────────────────────┐
│Engineering   │  │Engineering         │  │Engineering         │
│Issue         │  │Allocation          │  │Worklog             │
│──────────────│  │────────────────────│  │────────────────────│
│batchId       │  │batchId             │  │batchId             │
│issueKey      │  │developer           │  │issueKey            │
│issueId       │  │issueKey            │  │developer           │
│projectKey    │  │technology          │  │started             │
│issueType     │  │originalEstimateHrs │  │hours               │
│technology    │  │resolvedEstimateHrs │  │author              │
│summary       │  │actualHours         │  └────────────────────┘
│status        │  │worklogCount        │
│statusCategory│  └────────────────────┘
│created       │
│resolved      │     (future, not implemented)
│parentIssue   │     EngineeringQualityEvent
│sprint        │       batchId, issueKey, developer,
│month         │       eventType, occurredAt, hoursSpent
└──────────────┘
        ▲                 ▲
        │  issueKey       │ issueKey + developer
        └─────────────────┘
```

### Refinement notes (post-12A design pass)

- Removed from EngineeringAllocation: QA Bug Count, UAT Bug Count, Recovery Hours.
- Quality facts → future **EngineeringQualityEvent** (documented only; not implemented).
- Added to EngineeringIssue: `projectKey`, `issueStatusCategory`.

# 4 Files Created

| File | Purpose |
|------|---------|
| `src/services/engineering-warehouse/types.ts` | Schema version, BatchId, DateRange, status |
| `src/services/engineering-warehouse/entities/sync-batch.ts` | SyncBatch entity |
| `src/services/engineering-warehouse/entities/engineering-issue.ts` | EngineeringIssue entity |
| `src/services/engineering-warehouse/entities/engineering-allocation.ts` | EngineeringAllocation entity |
| `src/services/engineering-warehouse/entities/engineering-worklog.ts` | EngineeringWorklog entity |
| `src/services/engineering-warehouse/repositories/sync-batch-repository.ts` | SyncBatchRepository contract |
| `src/services/engineering-warehouse/repositories/engineering-issue-repository.ts` | EngineeringIssueRepository contract |
| `src/services/engineering-warehouse/repositories/engineering-allocation-repository.ts` | EngineeringAllocationRepository contract |
| `src/services/engineering-warehouse/repositories/engineering-worklog-repository.ts` | EngineeringWorklogRepository contract |
| `src/services/engineering-warehouse/index.ts` | Public exports |
| `docs/Engineering-Analytics-Warehouse.md` | Warehouse architecture document |
| `docs/reviews/milestone-12A-review.md` | This review package |

# 5 Files Modified

| File | Change |
|------|--------|
| `docs/reviews/README.md` | Link EAW doc + milestone-12A review |
| `docs/Glossary.md` | Engineering Analytics Warehouse term |

# 6 Files Explicitly Not Modified

- Orchestrator
- Analytics engines
- Dashboard / repository / snapshot modules
- No PostgreSQL, ORM, migrations, or SQL files

# 7 Public Interfaces

```typescript
export const WAREHOUSE_SCHEMA_VERSION = "1.0";

type WarehouseBatchStatus = "Running" | "Completed" | "Failed";
type BatchId = string;
type IsoTimestamp = string;

interface DateRange {
  readonly from: IsoTimestamp;
  readonly to: IsoTimestamp;
}

interface SyncBatch { /* ... */ }
interface EngineeringIssue { /* ... */ }
interface EngineeringAllocation { /* ... */ }
interface EngineeringWorklog { /* ... */ }

interface SyncBatchRepository {
  saveBatch(batch: SyncBatch): Promise<void>;
  saveMany(batches: readonly SyncBatch[]): Promise<void>;
  findByBatch(batchId: BatchId): Promise<SyncBatch | null>;
  findByIssue(issueKey: string): Promise<readonly SyncBatch[]>;
  findByDeveloper(developer: string): Promise<readonly SyncBatch[]>;
  findByDateRange(range: DateRange): Promise<readonly SyncBatch[]>;
}

interface EngineeringIssueRepository {
  saveBatch(batchId: BatchId, issues: readonly EngineeringIssue[]): Promise<void>;
  saveMany(issues: readonly EngineeringIssue[]): Promise<void>;
  findByBatch(batchId: BatchId): Promise<readonly EngineeringIssue[]>;
  findByIssue(issueKey: string): Promise<readonly EngineeringIssue[]>;
  findByDeveloper(developer: string): Promise<readonly EngineeringIssue[]>;
  findByDateRange(range: DateRange): Promise<readonly EngineeringIssue[]>;
}

interface EngineeringAllocationRepository {
  saveBatch(batchId: BatchId, allocations: readonly EngineeringAllocation[]): Promise<void>;
  saveMany(allocations: readonly EngineeringAllocation[]): Promise<void>;
  findByBatch(batchId: BatchId): Promise<readonly EngineeringAllocation[]>;
  findByIssue(issueKey: string): Promise<readonly EngineeringAllocation[]>;
  findByDeveloper(developer: string): Promise<readonly EngineeringAllocation[]>;
  findByDateRange(range: DateRange): Promise<readonly EngineeringAllocation[]>;
}

interface EngineeringWorklogRepository {
  saveBatch(batchId: BatchId, worklogs: readonly EngineeringWorklog[]): Promise<void>;
  saveMany(worklogs: readonly EngineeringWorklog[]): Promise<void>;
  findByBatch(batchId: BatchId): Promise<readonly EngineeringWorklog[]>;
  findByIssue(issueKey: string): Promise<readonly EngineeringWorklog[]>;
  findByDeveloper(developer: string): Promise<readonly EngineeringWorklog[]>;
  findByDateRange(range: DateRange): Promise<readonly EngineeringWorklog[]>;
}
```

Import surface: `@/services/engineering-warehouse`

# 8 Type Definitions

## SyncBatch

| Conceptual | TS | Type |
|------------|-----|------|
| BatchId | `batchId` | `BatchId` |
| StartedAt | `startedAt` | `IsoTimestamp` |
| CompletedAt | `completedAt` | `IsoTimestamp \| null` |
| Duration | `durationMs` | `number \| null` |
| Status | `status` | `WarehouseBatchStatus` |
| IssuesProcessed | `issuesProcessed` | `number` |
| WorklogsProcessed | `worklogsProcessed` | `number` |
| WarehouseSchemaVersion | `warehouseSchemaVersion` | `WarehouseSchemaVersion` |

## EngineeringIssue

`batchId`, `issueKey`, `issueId`, `projectKey`, `issueType`, `technology`, `summary`, `status`, `issueStatusCategory`, `created`, `resolved`, `parentIssue`, `sprint`, `month`

## EngineeringAllocation

`batchId`, `developer`, `issueKey`, `technology`, `originalEstimateHours`, `resolvedEstimateHours`, `actualHours`, `worklogCount`

(No `qaBugCount` / `uatBugCount` / `recoveryHours` — those belong to future EngineeringQualityEvent.)

## EngineeringWorklog

`batchId`, `issueKey`, `developer`, `started`, `hours`, `author`

## Future (documented only): EngineeringQualityEvent

`batchId`, `issueKey`, `developer`, `eventType`, `occurredAt`, `hoursSpent` — **not implemented** in 12A.

## Ownership summary

| Entity | Owner | Source |
|--------|-------|--------|
| SyncBatch | EAW | Warehouse ingest metadata |
| EngineeringIssue | EAW (analytics copy) | Normalized from Jira |
| EngineeringAllocation | EAW | Derived **facts** from estimates/worklogs — not scores |
| EngineeringWorklog | EAW | Atomic Jira worklog facts |

Jira remains operational owner of live issues/worklogs.

# 9 Relationships

- `SyncBatch` 1—* `EngineeringIssue` via `batchId`
- `SyncBatch` 1—* `EngineeringAllocation` via `batchId`
- `SyncBatch` 1—* `EngineeringWorklog` via `batchId`
- Issue ↔ Allocation ↔ Worklog via `issueKey` (+ `developer` where applicable)

# 10 No DB Implementation (verification)

| Forbidden in 12A | Status |
|------------------|--------|
| PostgreSQL connection | Not added |
| Prisma / Drizzle / ORM | Not added |
| Migrations / SQL files | Not added |
| Repository implementations | Interfaces only |
| Orchestrator / engines / dashboard edits | Not modified |

# 11 Build Output

```
> teampulse@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 7.0s
  Running TypeScript ...
  Finished TypeScript in 6.3s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/15) ...
✓ Generating static pages using 7 workers (15/15) in 527ms
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

## Known limitations

- No persistence yet — contracts only; runtime still uses current sync/snapshot path.
- `findByIssue` / `findByDeveloper` on `SyncBatchRepository` and cross-entity joins are defined for a uniform repository surface; concrete query plans wait for PostgreSQL.
- Quality/recovery facts are deferred to future **EngineeringQualityEvent** (not modeled in code yet).
- One-year retention is policy-only until a purge job exists.
- In-memory snapshot visibility across Next.js request boundaries remains a separate runtime concern (not part of 12A).

## Future PostgreSQL implementation plan

1. Select PostgreSQL + migration approach (explicit decision; not assumed Prisma/Drizzle).
2. Map entities → tables (`sync_batch`, `engineering_issue`, `engineering_allocation`, `engineering_worklog`) with `batch_id` FKs and uniqueness on natural keys.
3. Implement the four repository interfaces.
4. Generate unique `batchId` per orchestrator sync; write facts after resolve, before/alongside snapshot publish.
5. Keep engines computing scores from facts; **never** add score columns.
6. Add retention job: delete SyncBatch older than 365 days with cascading fact deletes.
7. Optionally read historical ranges from EAW for trend analytics once engines support multi-period input.

---

Waiting for architecture review.
