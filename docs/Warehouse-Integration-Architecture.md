# Warehouse Integration Architecture

Version: 1.0  
Status: Architecture (Milestone 12B)  
Owner: TeamPulse

---

## Purpose

This document defines how TeamPulse **transitions from Jira-driven analytics to Warehouse-driven analytics**.

Milestone **12A** defined the Engineering Analytics Warehouse (EAW) entity and repository **contracts**.  
Milestone **12B** defines the **integration architecture**: ownership, pipeline, batch lifecycle, atomic commit rules, and failure recovery.

**This milestone is architecture only.** It does not connect PostgreSQL, add ORM/SQL, change runtime behavior, or modify orchestrator / analytics engine / repository implementations.

| Today (pre-warehouse runtime) | Target (warehouse-driven) |
|-------------------------------|---------------------------|
| Orchestrator fetches Jira → engines read Jira-shaped inputs | Orchestrator ingests Jira → writes facts to EAW → engines read EAW only |
| Dashboard may depend on in-memory snapshot | Dashboard reads analytics computed from the latest **Completed** batch |
| Jira is both ingest and analytics source | Jira is **ingest only** |

Related: `docs/Engineering-Analytics-Warehouse.md` (entity model).

---

## Integration principles

1. **Analytics engines read only from the Engineering Analytics Warehouse.** Never directly from Jira.
2. **Jira becomes ingest only.** Operational system of record for live work; not the analytics read path.
3. **Each sync creates one immutable Batch** (`SyncBatch` with unique `batchId`).
4. **Warehouse writes are atomic.** Either the complete batch succeeds or nothing is committed as Completed.
5. **Dashboard always reads the latest Completed Batch.** Never partially written data.

Derived metrics (Engineering Score, Technology Health, Quality Score, Recovery Score, ranks) remain **compute-time only** and are never persisted in the warehouse (12A rule unchanged).

---

## Pipeline

Future runtime pipeline (target state):

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

### Stage summary

| # | Stage | Role |
|---|--------|------|
| 1 | Jira | Fetch operational issues / worklogs (ingest) |
| 2 | Resolve Estimates | Normalize estimate facts for warehouse shape |
| 3 | Resolve Worklogs | Normalize worklog attribution facts |
| 4 | Engineering Warehouse Model | Build in-memory SyncBatch + issues + allocations + worklogs (+ future quality events) |
| 5 | Warehouse Validation | Structural / referential checks before commit |
| 6 | Atomic Batch Commit | Persist complete batch as Completed — or commit nothing |
| 7 | Analytics Engine | Read **only** warehouse facts for the latest Completed batch; compute scores |
| 8 | Dashboard Repository | Expose presentation model from engine/snapshot of that batch |
| 9 | React | Render DashboardData |

---

## Ownership matrix

For every stage: Input → Output → Owner → Failure behavior.

| Stage | Input | Output | Owner | Failure behavior |
|-------|-------|--------|-------|------------------|
| **Jira fetch** | Sync trigger, reporting window / JQL config | Raw Jira issues + embedded worklogs | Orchestrator (ingest adapter) | Abort sync; no batch commit; previous Completed batch remains dashboard source |
| **Resolve Estimates** | Raw issues | Resolved estimate records (facts) | Estimate resolution module (existing engines as **ingest helpers**, not analytics read path) | Abort sync; no warehouse write |
| **Resolve Worklogs** | Estimate-resolved issues | Developer-attributed worklog facts | Worklog resolution module (ingest helper) | Abort sync; no warehouse write |
| **Engineering Warehouse Model** | Resolved facts + new `batchId` | In-memory `SyncBatch`, `EngineeringIssue[]`, `EngineeringAllocation[]`, `EngineeringWorklog[]` | Warehouse model builder (future; owned by EAW integration layer) | Abort; nothing persisted |
| **Warehouse Validation** | In-memory warehouse model | Validated model ready to commit, or validation errors | Warehouse validation (EAW) | Abort; no commit; mark sync Failed in live SyncState only (no Completed batch) |
| **Atomic Batch Commit** | Validated model | Persisted Completed `SyncBatch` + child facts, or no change | Warehouse repositories / unit-of-work (future PostgreSQL) | Roll back entire unit of work; no Completed batch; dashboard unchanged |
| **Analytics Engine** | Latest Completed batch facts from EAW | Developer Profiles, Technology Profiles, scores (in memory) | Analytics engines | Do not write warehouse; do not publish partial dashboard; keep prior presentation |
| **Dashboard Repository** | Engine/snapshot projection for latest Completed batch | `DashboardData` (+ `generatedAt`) | Dashboard Repository | Empty / previous safe state; never serve partial batch |
| **React** | `DashboardData` | UI | Dashboard page | Display repository result only |

### Ownership clarifications

- **Jira** owns operational truth; TeamPulse never writes back to Jira in this architecture.
- **EAW** owns historical engineering facts and Completed batch identity.
- **Analytics engines** own formulas; they **consume EAW**, never Jira, in the target architecture.
- **Dashboard Repository** owns UI data access; it must not read Jira or incomplete batches.
- Existing estimate/worklog resolvers remain useful as **ingest transformers** until replaced; their role shifts from “engine input” to “warehouse fact builders.”

---

## Sequence diagram

```
Actor / API          Orchestrator           EAW (future)         Analytics Engines      Dashboard Repo      React
    |                     |                      |                      |                    |               |
    |-- POST /api/sync -->|                      |                      |                    |               |
    |                     |-- Fetch Jira ------->| (external)           |                    |               |
    |                     |-- Resolve Estimates  |                      |                    |               |
    |                     |-- Resolve Worklogs   |                      |                    |               |
    |                     |-- Build warehouse model (in memory)         |                    |               |
    |                     |-- Validate --------->|                      |                    |               |
    |                     |-- BEGIN atomic commit|                      |                    |               |
    |                     |-- saveBatch + children (all or nothing)     |                    |               |
    |                     |-- COMMIT Completed ->|                      |                    |               |
    |                     |                      |                      |                    |               |
    |                     |-- Read latest Completed batch ------------->|                    |               |
    |                     |                      |-- facts ------------>|                    |               |
    |                     |                      |                      |-- profiles/scores   |               |
    |                     |-- Publish presentation (snapshot / projection) ------------------>|               |
    |<---- sync result ---|                      |                      |                    |               |
    |                     |                      |                      |                    |               |
    |-- GET /dashboard -->|                      |                      |                    |               |
    |                     |                      |                      |                    |-- read latest |
    |                     |                      |                      |                    |   Completed   |
    |                     |                      |                      |                    |-- DashboardData
    |                     |                      |                      |                    |-------------->|
    |<---- HTML / RSC ----|                      |                      |                    |               |
```

On any failure before successful COMMIT: engines and dashboard continue to use the **previous** Completed batch (if any).

---

## Batch lifecycle

```
                    create batchId
                          │
                          ▼
                     ┌─────────┐
                     │ Running │  (in-memory / optional draft — not dashboard-readable)
                     └────┬────┘
                          │
            ┌─────────────┼─────────────┐
            │ validation  │             │ ingest / model / validate fails
            │ + atomic    │             ▼
            │ commit OK   │        ┌─────────┐
            ▼             │        │ Failed  │  (no Completed publish; prior batch kept)
     ┌───────────┐        │        └─────────┘
     │ Completed │◄───────┘
     └─────┬─────┘
           │
           │ immutable facts for batchId
           │ dashboard + engines may read
           ▼
     (retention: delete batch + children after 1 year)
```

### Rules

| Rule | Detail |
|------|--------|
| Unique Batch ID | Every sync allocates one new `batchId` |
| Immutability | Completed batch facts are never mutated in place; corrections = new sync / new batch |
| Dashboard visibility | Only `status === "Completed"` batches are readable for analytics/UI |
| Running / Failed | Not consumable by Analytics Engine or Dashboard Repository |
| Schema version | `warehouseSchemaVersion` stamped on the batch at commit |

---

## Atomic batch rules

1. **Unit of work** includes: `SyncBatch` + all `EngineeringIssue` + `EngineeringAllocation` + `EngineeringWorklog` rows for that `batchId` (and future `EngineeringQualityEvent` when added).
2. **Commit boundary:** status transitions to `Completed` only after all child facts are durable in the same transaction.
3. **All-or-nothing:** if any write fails, roll back; no orphan issues/allocations/worklogs for that `batchId`.
4. **No partial reads:** readers query only batches marked Completed; never “latest Running.”
5. **Idempotency (future):** a sync attempt that fails leaves no Completed batch; retry creates a **new** `batchId` (preferred) rather than mutating a Failed batch into Completed without a full rewrite.

---

## Failure recovery

| Failure point | Warehouse state | Analytics / Dashboard | Operator action |
|---------------|-----------------|------------------------|-----------------|
| Jira fetch error | Unchanged | Previous Completed batch | Retry sync |
| Resolve estimates/worklogs error | Unchanged | Previous Completed batch | Fix data/config; retry |
| Warehouse model build error | Unchanged | Previous Completed batch | Fix mapper; retry |
| Validation error | Unchanged | Previous Completed batch | Fix validation/data; retry |
| Atomic commit / DB error | Rolled back | Previous Completed batch | Fix store; retry |
| Analytics engine error after commit | New Completed batch exists | Prefer: do not publish broken projection; keep prior presentation until engines succeed on the new batch | Re-run analytics-only job (future) against same `batchId` |
| Dashboard read error | Unchanged | Empty / safe fallback | Investigate repository |

**Invariant:** a Failed or incomplete sync must never replace the dashboard’s Completed source of truth.

---

## Warehouse ownership

| Artifact | Owner | Consumers |
|----------|-------|-----------|
| Raw Jira payload (transient) | Orchestrator ingest | Warehouse model builder only |
| SyncBatch + engineering facts | **Engineering Analytics Warehouse** | Analytics engines, retention jobs |
| Derived scores / profiles | Analytics engines (ephemeral or snapshot projection) | Dashboard Repository |
| DashboardData | Dashboard Repository / snapshot projection | React |
| Live SyncState (progress UI) | Orchestrator (process-local today; future SyncStateProvider) | `/api/sync` clients — **not** the analytics system of record |

EAW does **not** own Engineering Score or Technology Health columns.  
EAW **does** own the Completed batch that engines must use as input.

---

## Future PostgreSQL mapping

Design guidance only (no SQL in 12B):

| Concern | Approach |
|---------|----------|
| Atomicity | Single DB transaction per batch commit |
| Isolation | Readers use `READ COMMITTED` / snapshot isolation; filter `status = 'Completed'` |
| Latest Completed | Query `sync_batch` ordered by `completed_at DESC` where status Completed, limit 1 — or maintain a singleton “latest_completed_batch_id” pointer updated **inside** the same transaction as the commit |
| Child tables | FK `batch_id` → `sync_batch`; delete cascade for retention |
| Engines | Repository `findByBatch(latestCompletedId)` — never Jira client |

Suggested pointer update (conceptual):

```
BEGIN
  insert sync_batch + children
  set status = Completed
  update latest_completed_batch_id = :batchId
COMMIT
```

If `COMMIT` fails, pointer and children remain as before.

---

## Incremental sync strategy (high level)

Full design deferred; principles only:

1. **Baseline:** first successful sync writes a full Completed batch for the reporting window.
2. **Incremental (future):** subsequent syncs may fetch Jira deltas (updated since watermark) and produce a **new** immutable batch that represents the refreshed fact set for the window (rebuild window facts) — not in-place mutation of prior batches.
3. **Watermark:** store last successful ingest cursor on SyncBatch metadata (future field) or sidecar config — still facts/metadata, not scores.
4. **Recompute:** analytics engines always recompute derived metrics from the latest Completed batch facts; formula changes do not require rewriting historical batches.
5. **No Jira reads in engines:** even incremental paths end in warehouse facts before any score calculation.

---

## Explicit non-goals (12B)

- PostgreSQL connection, ORM, SQL, migrations
- Repository implementations
- Orchestrator / analytics engine / dashboard runtime changes
- Implementing `EngineeringQualityEvent`
- Changing current in-memory snapshot behavior

---

## Transition note (current → target)

Until warehouse persistence and engine read-path cutover are implemented in later milestones:

- Current runtime may still resolve Jira inside the orchestrator and feed engines directly.
- 12B defines the **target contract** those milestones must satisfy.
- Cutover criterion: engines have **zero** Jira clients; dashboard serves only analytics derived from the latest Completed warehouse batch.
