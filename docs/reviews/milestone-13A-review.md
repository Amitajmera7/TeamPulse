# Review Checklist

- [ ] Architecture
- [ ] Connection Design
- [ ] Transaction Design
- [ ] Repository Implementations
- [ ] Schema (DDL only, no auto-migrate)
- [ ] Configuration
- [ ] No runtime / engine / orchestrator / dashboard changes
- [ ] Build Passes

# 1 Objective

Build the **PostgreSQL persistence foundation** for the Engineering Analytics Warehouse (Sprint 5B Milestone 13A).

Infrastructure only:

- Connection abstraction
- Transaction abstraction
- Repository implementations for existing 12A interfaces
- Schema DDL as documentation/constants (not executed automatically)

Do **not** modify analytics engines, orchestrator behavior, dashboard, repository consumers, or runtime flow. Do not migrate existing data.

# 2 Files Created

| File | Purpose |
|------|---------|
| `src/services/engineering-warehouse/persistence/queryable.ts` | Shared `Queryable` type |
| `src/services/engineering-warehouse/persistence/connection.ts` | Pool / env config |
| `src/services/engineering-warehouse/persistence/transaction.ts` | `withWarehouseTransaction` |
| `src/services/engineering-warehouse/persistence/schema.ts` | DDL constants (mirror of migration file; no auto-run) |
| `src/services/engineering-warehouse/persistence/schema/001_initial.sql` | Versioned initial migration (not executed) |
| `src/services/engineering-warehouse/persistence/schema/README.md` | Migration versioning + worklog identity docs |
| `src/services/engineering-warehouse/persistence/worklog-identity.ts` | `buildEngineeringWorklogKey` (jira / fact) |
| `src/services/engineering-warehouse/persistence/mappers.ts` | Row ↔ entity mappers |
| `src/services/engineering-warehouse/persistence/repositories/sync-batch-postgres.ts` | `PostgresSyncBatchRepository` |
| `src/services/engineering-warehouse/persistence/repositories/engineering-issue-postgres.ts` | `PostgresEngineeringIssueRepository` |
| `src/services/engineering-warehouse/persistence/repositories/engineering-allocation-postgres.ts` | `PostgresEngineeringAllocationRepository` |
| `src/services/engineering-warehouse/persistence/repositories/engineering-worklog-postgres.ts` | `PostgresEngineeringWorklogRepository` (idempotent UPSERT) |
| `src/services/engineering-warehouse/persistence/index.ts` | Persistence exports + factory |
| `docs/PostgreSQL-Persistence.md` | Persistence documentation |
| `docs/reviews/milestone-13A-review.md` | This review package |

# 3 Files Modified

| File | Change |
|------|--------|
| `src/services/engineering-warehouse/index.ts` | Re-export persistence surface |
| `next.config.ts` | `serverExternalPackages: ["pg", "better-sqlite3"]` |
| `package.json` / `package-lock.json` | Add `pg`, `@types/pg` |
| `docs/reviews/README.md` | Link PostgreSQL Persistence + 13A review |
| `docs/Glossary.md` | PostgreSQL Persistence term |

# 4 Repository Implementations

| Interface | Implementation | Table |
|-----------|----------------|-------|
| `SyncBatchRepository` | `PostgresSyncBatchRepository` | `sync_batch` |
| `EngineeringIssueRepository` | `PostgresEngineeringIssueRepository` | `engineering_issue` |
| `EngineeringAllocationRepository` | `PostgresEngineeringAllocationRepository` | `engineering_allocation` |
| `EngineeringWorklogRepository` | `PostgresEngineeringWorklogRepository` | `engineering_worklog` |

All expose: `saveBatch`, `saveMany`, `findByBatch`, `findByIssue`, `findByDeveloper`, `findByDateRange`.

Factory: `createPostgresWarehouseRepositories(db?)` — bind to pool or transaction client.

No analytics logic inside repositories.

# 5 Connection Design

- Lazy singleton `Pool` via `getWarehousePool()`
- Config from `DATABASE_URL` (+ optional pool env vars)
- `getWarehouseQueryable()` returns the pool as `Queryable`
- `closeWarehousePool()` for shutdown/tests
- Throws if `DATABASE_URL` missing when pool is first created

# 6 Transaction Design

`withWarehouseTransaction(work)`:

`BEGIN` → `work(client)` → `COMMIT` | `ROLLBACK` + rethrow → `release`

Repositories accept `Queryable`, so atomic batch commits use:

```typescript
await withWarehouseTransaction(async (tx) => {
  const repos = createPostgresWarehouseRepositories(tx);
  // save SyncBatch + children
});
```

Not wired to orchestrator in 13A.

# 7 Configuration

| Env | Required | Purpose |
|-----|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DATABASE_POOL_MAX` | No | Pool size |
| `DATABASE_POOL_IDLE_TIMEOUT_MS` | No | Idle timeout |
| `DATABASE_CONNECTION_TIMEOUT_MS` | No | Connect timeout |

Documented in `docs/PostgreSQL-Persistence.md`.

# 8 Schema

`WAREHOUSE_SCHEMA_STATEMENTS` / `getWarehouseSchemaSql()` — **not executed** by the app.

Tables: `sync_batch`, `engineering_issue`, `engineering_allocation`, `engineering_worklog`  
FK cascade from children → `sync_batch`.  
No derived-metric columns.

# 9 Build Output

```
> teampulse@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 4.7s
  Running TypeScript ...
  Finished TypeScript in 4.6s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/15) ...
✓ Generating static pages using 7 workers (15/15) in 447ms
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

# 10 Known Limitations

- Schema must be applied manually; migration **framework** exists (`schema/001_initial.sql`) but no runner yet.
- Persistence is not used by orchestrator/dashboard — runtime path unchanged.
- Jira worklog `id` is not yet present on task-evaluation worklog types; ingest must supply `jiraWorklogId` / `worklogKey` later. Until then, deterministic `fact:` keys are the documented fallback.
- `saveMany` loops per-row (no bulk COPY) — acceptable for foundation.
- No connection health check / retry policy beyond `pg` defaults.
- Requires `DATABASE_URL` only when pool is actually opened.
- `/dashboard` remains **static** (see §10b) — intentional under 13A no-runtime-change rule.

# 10b Dashboard static classification

| Observation | `/dashboard` is `○` (Static) in `next build` |
|-------------|-----------------------------------------------|
| Root cause | Page has no `force-dynamic` / request-time APIs; `getDashboardData()` is sync over in-memory snapshot |
| Accidental? | Relative to future warehouse-driven dynamic reads — yes, static is not the end state |
| Intentional for 13A? | **Yes** — refining persistence must not change dashboard runtime behavior |
| Follow-up | Later milestone: read Completed batch at request time and/or `export const dynamic = "force-dynamic"` |

# 11 Future Milestone (13B)

Expected next step (not in scope here):

1. Migration runner applying `schema/NNN_*.sql` with recorded versions.
2. Wire atomic batch commit into ingest (per Warehouse Integration Architecture).
3. Optionally introduce latest-Completed batch pointer.
4. Capture Jira worklog ids at ingest for preferred `jira:` keys.
5. Still no analytics formula changes; engines remain unread from PG until a later cutover milestone.

# 12 Self Review

**Rating: 9 / 10**

Foundation matches 12A contracts and 12B atomic-batch intent without changing live sync. Refinement closes worklog duplication via `(batch_id, worklog_key)` UPSERT and adds a non-executing migration folder. Static `/dashboard` is documented, not “fixed,” per no-runtime-change constraint.

---

Waiting for architecture review.
