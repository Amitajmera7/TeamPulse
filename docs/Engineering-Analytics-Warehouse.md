# Engineering Analytics Warehouse (EAW)

Version: 1.0  
Status: Architecture (Milestone 12A)  
Owner: TeamPulse

---

## Purpose

The **Engineering Analytics Warehouse** is the long-term **system of record** for TeamPulse engineering analytics history.

| System | Role |
|--------|------|
| **Jira** | Operational system of record (live work, workflows, worklogs) |
| **Engineering Analytics Warehouse** | Analytics system of record (normalized engineering facts over time) |
| **Analytics engines / snapshot / dashboard** | Compute and present derived metrics from facts |

TeamPulse must not treat Jira as a historical analytics database. The warehouse retains **one year** of engineering facts so scores and health can be recomputed consistently as formulas evolve.

---

## Architecture

```
Jira (operational)
    ↓
Analytics Orchestrator (future: also writes warehouse facts)
    ↓
Engineering Analytics Warehouse  ← facts only (this design)
    ↓
Analytics Engines (read facts → compute scores)
    ↓
Analytics Snapshot / Dashboard Repository
    ↓
React Dashboard
```

### Principles

1. **Jira remains operational.** The warehouse never replaces Jira for day-to-day engineering work.
2. **Never persist derived metrics.** Engineering Score, Technology Health, Recovery Score, Quality Score, ranks, and status bands are computed at read time — not stored.
3. **Persist only engineering facts.** Issues, allocations, worklogs, and sync batch metadata.
4. **Retain one year** of engineering history (rolling retention).
5. **Every sync has a unique Batch ID** correlating all rows written in that ingest.

### Milestone 12A scope

- TypeScript **domain entities**
- TypeScript **repository contracts** (interfaces only)
- Documentation and review package

**Out of scope:** PostgreSQL, ORM, migrations, SQL, orchestrator wiring, engine changes, dashboard changes.

---

## Entity descriptions

TypeScript properties use camelCase (TeamPulse convention). Conceptual names from the warehouse design are shown in parentheses.

### SyncBatch

One Jira → warehouse synchronization.

| Field | TS property | Meaning |
|-------|-------------|---------|
| BatchId | `batchId` | Unique sync identifier |
| StartedAt | `startedAt` | Sync start (ISO-8601) |
| CompletedAt | `completedAt` | Sync end (null while Running) |
| Duration | `durationMs` | Elapsed ms (null while Running) |
| Status | `status` | `Running` \| `Completed` \| `Failed` |
| IssuesProcessed | `issuesProcessed` | Issue count for the batch |
| WorklogsProcessed | `worklogsProcessed` | Worklog count for the batch |
| WarehouseSchemaVersion | `warehouseSchemaVersion` | Logical schema version (`"1.0"`) |

### EngineeringIssue

Normalized Jira issue metadata for analytics history.

| Field | TS property |
|-------|-------------|
| BatchId | `batchId` |
| IssueKey | `issueKey` |
| IssueId | `issueId` |
| ProjectKey | `projectKey` |
| IssueType | `issueType` |
| Technology | `technology` |
| Summary | `summary` |
| Status | `status` |
| IssueStatusCategory | `issueStatusCategory` |
| Created | `created` |
| Resolved | `resolved` |
| ParentIssue | `parentIssue` |
| Sprint | `sprint` |
| Month | `month` |

`projectKey` and `issueStatusCategory` support long-term filtering (project rollups, To Do / In Progress / Done analytics) without storing derived scores.

### EngineeringAllocation

One row **per Developer per Issue** within a batch.

| Field | TS property |
|-------|-------------|
| BatchId | `batchId` |
| Developer | `developer` |
| IssueKey | `issueKey` |
| Technology | `technology` |
| OriginalEstimate | `originalEstimateHours` |
| ResolvedEstimate | `resolvedEstimateHours` |
| ActualHours | `actualHours` |
| WorklogCount | `worklogCount` |

Allocation stores **estimate and effort facts only**. It does **not** store QA Bug Count, UAT Bug Count, or Recovery Hours.

### EngineeringWorklog

One row **per worklog entry**.

| Field | TS property |
|-------|-------------|
| BatchId | `batchId` |
| WorklogKey | `worklogKey` |
| JiraWorklogId | `jiraWorklogId` |
| IssueKey | `issueKey` |
| Developer | `developer` |
| Started | `started` |
| Hours | `hours` |
| Author | `author` |

**Idempotency:** `worklogKey` is unique within a batch (`PRIMARY KEY (batch_id, worklog_key)`). Prefer `jira:{jiraWorklogId}` when Jira’s worklog id is available at ingest; otherwise `fact:{sha256(...)}` over issue/developer/started/hours/author. See `persistence/schema/README.md`.

### Future: EngineeringQualityEvent (not implemented)

Quality and recovery **facts** will live in a dedicated future entity so allocations stay free of bug/recovery aggregates and Quality Score / Recovery Score remain compute-time only.

**Do not implement in Milestone 12A.** Design direction only:

| Field | Meaning |
|-------|---------|
| IssueKey | Related issue |
| Developer | Attributed developer |
| EventType | e.g. QA Bug, UAT Bug, recovery work (string taxonomy TBD) |
| OccurredAt | When the event occurred (ISO-8601) |
| HoursSpent | Hours associated with the event |
| BatchId | Sync batch that ingested the event |

Conceptual TypeScript shape (documentation only — **no source file**):

```typescript
// FUTURE — not implemented in 12A
interface EngineeringQualityEvent {
  batchId: BatchId;
  issueKey: string;
  developer: string;
  eventType: string;
  occurredAt: IsoTimestamp;
  hoursSpent: number;
}
```

Engines will read quality events (when present) to compute Quality Score and Recovery metrics at read time. Those scores must still **never** be persisted in the warehouse.

---

## Ownership

| Concern | Owner |
|---------|-------|
| Operational issue/workflow truth | Jira |
| Historical engineering facts | Engineering Analytics Warehouse |
| Derived metrics (scores, health, ranks) | Analytics engines (compute only) |
| Latest presentation projection | Analytics Snapshot / Dashboard Repository |
| Sync pipeline orchestration | Analytics Orchestrator (future writer to EAW) |

The warehouse **owns** SyncBatch, EngineeringIssue, EngineeringAllocation, and EngineeringWorklog as analytics facts. Engines **must not** write scores into the warehouse. Future EngineeringQualityEvent facts (when added) are also warehouse-owned inputs — not scores.

---

## Relationships

```
SyncBatch (1)
    │
    ├──< EngineeringIssue (*)          via batchId
    │         │
    │         └── identified by issueKey (within batch)
    │
    ├──< EngineeringAllocation (*)     via batchId
    │         │
    │         └── Developer × IssueKey (within batch)
    │
    └──< EngineeringWorklog (*)        via batchId
              │
              └── IssueKey + Developer + Started (within batch)
```

- **BatchId** is the correlation key for all rows written in one sync.
- **IssueKey** links issues ↔ allocations ↔ worklogs.
- **Developer** links allocations ↔ worklogs (and, via join, issues).

---

## Repository contracts

Interfaces only (no implementations in 12A). Every repository exposes:

| Method | Role |
|--------|------|
| `saveBatch(...)` | Write under / as a sync batch |
| `saveMany(...)` | Bulk write |
| `findByBatch(batchId)` | Read by Batch ID |
| `findByIssue(issueKey)` | Read by issue |
| `findByDeveloper(developer)` | Read by developer |
| `findByDateRange(range)` | Read by inclusive ISO date range |

Module path: `src/services/engineering-warehouse/`

---

## Future PostgreSQL mapping

Suggested table mapping (design guidance only — **no SQL in this milestone**):

| Entity | Future table (suggested) | Notes |
|--------|--------------------------|-------|
| SyncBatch | `sync_batch` | PK `batch_id` |
| EngineeringIssue | `engineering_issue` | PK/unique `(batch_id, issue_key)` |
| EngineeringAllocation | `engineering_allocation` | PK/unique `(batch_id, issue_key, developer)` |
| EngineeringWorklog | `engineering_worklog` | PK `(batch_id, worklog_key)`; optional `jira_worklog_id` |

### Implementation plan (later milestones)

1. Choose PostgreSQL + migration tool (explicit decision — not Prisma/Drizzle by default in 12A).
2. Implement repository interfaces with a single `PostgresEngineeringWarehouse` (or per-entity repos).
3. Wire orchestrator **after** Jira fetch/resolve to write facts under a new `batchId`.
4. Keep analytics engines reading facts (warehouse and/or live resolve) and computing scores in memory.
5. Enforce retention job: delete batches (cascade facts) older than 365 days.
6. Never add columns for Engineering Score, Technology Health, Recovery Score, or Quality Score.

---

## Retention policy

- **Retain:** 1 year (365 days) of engineering history measured from SyncBatch `startedAt` (or `completedAt` when present).
- **Delete unit:** entire SyncBatch and all child facts for that `batchId`.
- **Rationale:** enough history for trends without unbounded growth; formulas can recompute from facts.

---

## Warehouse schema version

| Constant | Value |
|----------|-------|
| `WAREHOUSE_SCHEMA_VERSION` | `"1.0"` |

Every `SyncBatch.warehouseSchemaVersion` records the logical schema used when the batch was written. Future breaking entity changes increment this version; readers may branch on version when replaying history.

---

## Explicit non-goals (12A)

- Connecting PostgreSQL
- ORM / Prisma / Drizzle / migrations / SQL
- Modifying orchestrator, analytics engines, or dashboard
- Persisting derived metrics or Analytics Snapshot JSON as the warehouse system of record
