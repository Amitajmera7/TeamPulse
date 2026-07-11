# EAW Validation

Version: 1.0  
Status: Validation harness (Milestone 13B)  
Owner: TeamPulse

---

## Purpose

The **Engineering Analytics Warehouse (EAW) Validation Harness** checks that an **in-memory** warehouse model accurately and consistently represents a sync’s engineering facts **before** any PostgreSQL persistence is wired into the orchestrator.

Milestone **13B** is validation only:

- Does **not** write to PostgreSQL
- Does **not** execute SQL
- Does **not** change orchestrator, analytics engines, or dashboard runtime

Related:

- `docs/Engineering-Analytics-Warehouse.md`
- `docs/Warehouse-Integration-Architecture.md`
- `docs/PostgreSQL-Persistence.md`

---

## Validation philosophy

1. **Facts first.** Validate structural and referential integrity of warehouse entities — not Engineering Score or other derived metrics.
2. **Fail closed on errors.** Any error → report `status: "FAIL"`. Warnings do not fail the run.
3. **One batch at a time.** The harness validates a single `EngineeringWarehouseModel` (one `SyncBatch` + children).
4. **Pure functions.** Validators take the model and return a `ValidationReport`; no I/O, no DB, no Jira calls.
5. **Gate for future commit.** Per Warehouse Integration Architecture, validation sits before Atomic Batch Commit. 13B implements the gate logic without wiring it.

```
… → Engineering Warehouse Model → Warehouse Validation → (future) Atomic Batch Commit
```

---

## In-memory model

```typescript
interface EngineeringWarehouseModel {
  syncBatch: SyncBatch;
  issues: readonly EngineeringIssue[];
  allocations: readonly EngineeringAllocation[];
  worklogs: readonly EngineeringWorklog[];
}
```

Entry point: `validateEngineeringWarehouseModel(model)`  
Module: `@/services/engineering-warehouse/validation`

---

## Validation rules

### SyncBatch

| Rule | Code (examples) |
|------|-----------------|
| `batchId` exists (non-empty) | `BATCH_ID_MISSING` |
| `startedAt <= completedAt` when completed | `BATCH_TIME_ORDER` |
| `issuesProcessed >= 0` | `BATCH_ISSUES_PROCESSED_INVALID` |
| `worklogsProcessed >= 0` | `BATCH_WORKLOGS_PROCESSED_INVALID` |
| schema version exists | `BATCH_SCHEMA_VERSION_MISSING` |

### EngineeringIssue

| Rule | Code (examples) |
|------|-----------------|
| unique `issueKey` within model | `ISSUE_DUPLICATE_KEY` |
| `technology` exists | `ISSUE_TECHNOLOGY_MISSING` |
| `issueType` exists | `ISSUE_TYPE_MISSING` |
| `projectKey` exists | `ISSUE_PROJECT_KEY_MISSING` |
| `created <= resolved` when resolved | `ISSUE_TIME_ORDER` |

### EngineeringAllocation

| Rule | Code (examples) |
|------|-----------------|
| one row per developer per issue | `ALLOCATION_DUPLICATE_PAIR` |
| `resolvedEstimateHours >= 0` | `ALLOCATION_RESOLVED_ESTIMATE_INVALID` |
| `actualHours >= 0` | `ALLOCATION_ACTUAL_HOURS_INVALID` |
| `worklogCount >= 0` | `ALLOCATION_WORKLOG_COUNT_INVALID` |
| `issueKey` references EngineeringIssue | `ALLOCATION_ISSUE_REF` |
| `batchId` references SyncBatch | `ALLOCATION_BATCH_MISMATCH` |

### EngineeringWorklog

| Rule | Code (examples) |
|------|-----------------|
| unique worklog identity (`worklogKey`) | `WORKLOG_DUPLICATE_IDENTITY` |
| `hours > 0` | `WORKLOG_HOURS_INVALID` |
| `issueKey` exists / references issue | `WORKLOG_ISSUE_KEY_MISSING` / `WORKLOG_ISSUE_REF` |
| `developer` exists | `WORKLOG_DEVELOPER_MISSING` |
| `batchId` exists / matches SyncBatch | `WORKLOG_BATCH_MISMATCH` |

### Cross-entity

| Rule | Code (examples) |
|------|-----------------|
| allocation issueKeys exist | `CROSS_ALLOCATION_ISSUE_MISSING` |
| worklog issueKeys exist | `CROSS_WORKLOG_ISSUE_MISSING` |
| allocation `actualHours` equals sum of worklog `hours` (per developer×issue) | `CROSS_ALLOCATION_WORKLOG_HOURS` |
| batch counts match entity counts | `CROSS_BATCH_ISSUE_COUNT`, `CROSS_BATCH_WORKLOG_COUNT` |

`worklogCount` vs worklog row count mismatches are reported as **warnings** (`CROSS_ALLOCATION_WORKLOG_COUNT`) so hour integrity remains the hard gate.

---

## Validation report format

```text
Validation Summary

PASS

Issues

2478

Worklogs

7454

Allocations

XXXX

Errors

0

Warnings

0
```

Structured TypeScript:

```typescript
interface ValidationReport {
  status: "PASS" | "FAIL";
  batchId: string | null;
  counts: { issues: number; worklogs: number; allocations: number };
  errors: ValidationFinding[];
  warnings: ValidationFinding[];
  summary: string; // human-readable block above
}
```

---

## Failure behavior

| Outcome | Meaning | Intended future use (not wired in 13B) |
|---------|---------|----------------------------------------|
| `PASS` | Zero errors | Allow Atomic Batch Commit |
| `FAIL` | One or more errors | Abort commit; keep previous Completed batch; surface findings to operators |
| Warnings only | Still `PASS` | Log / review; do not block commit by default |

This milestone **does not** invoke the harness from the orchestrator. Callers may use it in scripts or future integration tests.

---

## Future automated validation

1. Orchestrator builds `EngineeringWarehouseModel` after resolve steps.
2. Run `validateEngineeringWarehouseModel` before `withWarehouseTransaction`.
3. On `FAIL`, mark sync Failed and skip PostgreSQL commit.
4. Optionally persist validation reports for audit (separate from EAW facts).
5. CI sample fixtures: known-good and known-bad models assert PASS/FAIL.

---

## Explicit non-goals (13B)

- PostgreSQL writes / SQL execution
- Orchestrator, engine, or dashboard changes
- Changing live sync runtime behavior
- Validating derived analytics scores
