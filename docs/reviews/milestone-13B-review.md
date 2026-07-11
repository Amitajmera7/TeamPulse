# Review Checklist

- [ ] Architecture
- [ ] Validation Rules
- [ ] Validation Report Format
- [ ] No PostgreSQL / SQL / runtime wiring
- [ ] Build Passes

# 1 Objective

Build the **Engineering Analytics Warehouse (EAW) Validation Harness** (Sprint 5B Milestone 13B).

Validate that in-memory EAW entities are internally consistent **before** PostgreSQL persistence is wired into the orchestrator.

Validation only — no SQL, no PostgreSQL writes, no orchestrator / engine / dashboard / runtime changes.

# 2 Validation Rules

## SyncBatch

- `batchId` exists
- `startedAt <= completedAt` (when completed)
- `issuesProcessed >= 0`
- `worklogsProcessed >= 0`
- schema version exists

## EngineeringIssue

- unique `issueKey`
- `technology` / `issueType` / `projectKey` exist
- `created <= resolved` when resolved

## EngineeringAllocation

- one row per developer per issue
- `resolvedEstimateHours >= 0`
- `actualHours >= 0`
- `worklogCount >= 0`
- `issueKey` → EngineeringIssue
- `batchId` → SyncBatch

## EngineeringWorklog

- unique `worklogKey`
- `hours > 0`
- `issueKey` / `developer` / `batchId` exist (and issue/batch refs)

## Cross-entity

- allocation & worklog issueKeys exist
- allocation `actualHours` == Σ worklog `hours` (developer×issue)
- `issuesProcessed` / `worklogsProcessed` match entity counts
- worklogCount mismatches → **warnings**

# 3 Validation Report Format

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

```typescript
interface ValidationReport {
  status: "PASS" | "FAIL";
  batchId: string | null;
  counts: { issues: number; worklogs: number; allocations: number };
  errors: ValidationFinding[];
  warnings: ValidationFinding[];
  summary: string;
}
```

Entry: `validateEngineeringWarehouseModel(model: EngineeringWarehouseModel)`

# 4 Files Created

| File | Purpose |
|------|---------|
| `src/services/engineering-warehouse/validation/types.ts` | Model + report types |
| `src/services/engineering-warehouse/validation/collector.ts` | Finding collector + summary formatter |
| `src/services/engineering-warehouse/validation/validate-sync-batch.ts` | SyncBatch rules |
| `src/services/engineering-warehouse/validation/validate-engineering-issues.ts` | Issue rules |
| `src/services/engineering-warehouse/validation/validate-engineering-allocations.ts` | Allocation rules |
| `src/services/engineering-warehouse/validation/validate-engineering-worklogs.ts` | Worklog rules |
| `src/services/engineering-warehouse/validation/validate-cross-entity.ts` | Cross-entity rules |
| `src/services/engineering-warehouse/validation/validate-warehouse-model.ts` | Orchestrates validators |
| `src/services/engineering-warehouse/validation/index.ts` | Public exports |
| `docs/EAW-Validation.md` | Validation documentation |
| `docs/reviews/milestone-13B-review.md` | This review package |

# 5 Files Modified

| File | Change |
|------|--------|
| `src/services/engineering-warehouse/index.ts` | Export validation surface |
| `docs/reviews/README.md` | Link EAW-Validation + 13B review |
| `docs/Glossary.md` | EAW Validation Harness term |

# 6 Files Explicitly Not Modified

- Orchestrator
- Analytics engines
- Dashboard
- PostgreSQL persistence runtime usage
- No SQL execution

# 7 Build Output

```
> teampulse@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 5.5s
  Running TypeScript ...
  Finished TypeScript in 5.3s ...
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
✓ Generating static pages using 7 workers (15/15) in 692ms
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

# 8 Self Review

**Rating: 9 / 10**

## Strengths

- Pure in-memory harness matching 12B “validate before commit” gate
- Structured report + human summary block as specified
- Cross-checks hours and batch counts without touching analytics formulas

## Known limitations

- Not wired into orchestrator (intentional)
- No fixture/CI tests yet
- Worklog↔allocation hour equality uses float epsilon; very small rounding drift may warn/fail depending on ingest precision
- Does not call Jira — assumes the in-memory model is already mapped

## Next (after review)

Wire harness before atomic PostgreSQL commit; add known-good/bad fixtures.

---

Waiting for architecture review.
