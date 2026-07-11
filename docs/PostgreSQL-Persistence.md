# PostgreSQL Persistence — Engineering Analytics Warehouse

Version: 1.0  
Status: Infrastructure (Milestone 13A)  
Owner: TeamPulse

---

## Purpose

This document describes the **PostgreSQL persistence foundation** for the Engineering Analytics Warehouse (EAW).

Milestone **13A** adds:

- Connection abstraction (`DATABASE_URL`)
- Transaction abstraction (atomic batch support)
- Repository implementations satisfying 12A interfaces
- Schema DDL as **documentation / constants only** (not auto-applied)

It does **not** change runtime sync, analytics engines, orchestrator behavior, or dashboard reads.

Related:

- `docs/Engineering-Analytics-Warehouse.md`
- `docs/Warehouse-Integration-Architecture.md`

---

## Configuration

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://user:pass@localhost:5432/teampulse` |

### Optional pool settings

| Variable | Description |
|----------|-------------|
| `DATABASE_POOL_MAX` | Max clients in the pool (`pg` `max`) |
| `DATABASE_POOL_IDLE_TIMEOUT_MS` | Idle client timeout (`idleTimeoutMillis`) |
| `DATABASE_CONNECTION_TIMEOUT_MS` | Connection timeout (`connectionTimeoutMillis`) |

Example `.env.local` (do not commit secrets):

```
DATABASE_URL=postgresql://teampulse:teampulse@localhost:5432/teampulse
DATABASE_POOL_MAX=10
```

Missing `DATABASE_URL` throws when the pool is first requested — not at Next.js import time for unrelated routes, unless something imports and calls `getWarehousePool()`.

---

## Connection lifecycle

```
getWarehousePoolConfig()  ← reads env
        ↓
getWarehousePool()        ← lazy singleton Pool
        ↓
getWarehouseQueryable()   ← Pool as Queryable
        ↓
Repositories use Queryable.query(...)
        ↓
closeWarehousePool()      ← tests / shutdown
```

- **Lazy:** no pool is created until `getWarehousePool()` / repository default constructor needs it.
- **Server-only:** intended for Node server contexts (API / future jobs). Listed in `serverExternalPackages`.
- **No business logic** in `connection.ts`.

---

## Transaction model

`withWarehouseTransaction(work)`:

1. `pool.connect()`
2. `BEGIN`
3. `await work(client)` — pass `client` into repositories
4. `COMMIT` on success
5. `ROLLBACK` on error, then rethrow
6. `client.release()` in `finally`

Atomic batch pattern (for Milestone 13B / integration — not wired yet):

```typescript
await withWarehouseTransaction(async (tx) => {
  const repos = createPostgresWarehouseRepositories(tx);
  await repos.syncBatches.saveBatch(batch);
  await repos.issues.saveBatch(batch.batchId, issues);
  await repos.allocations.saveBatch(batch.batchId, allocations);
  await repos.worklogs.saveBatch(batch.batchId, worklogs);
});
```

Either the full unit succeeds or nothing is committed.

---

## Repository mapping

| Interface (12A) | PostgreSQL class | Table |
|-----------------|------------------|-------|
| `SyncBatchRepository` | `PostgresSyncBatchRepository` | `sync_batch` |
| `EngineeringIssueRepository` | `PostgresEngineeringIssueRepository` | `engineering_issue` |
| `EngineeringAllocationRepository` | `PostgresEngineeringAllocationRepository` | `engineering_allocation` |
| `EngineeringWorklogRepository` | `PostgresEngineeringWorklogRepository` | `engineering_worklog` |

Factory: `createPostgresWarehouseRepositories(db?)`.

Repositories:

- Implement existing interfaces only
- Contain **no** analytics formulas
- Accept optional `Queryable` (pool or transaction client)

### Schema notes

Versioned migration files (framework only — **not auto-executed**):

```
persistence/schema/
  README.md
  001_initial.sql
```

TypeScript mirror: `persistence/schema.ts` (`WAREHOUSE_SCHEMA_STATEMENTS` / `getWarehouseSchemaSql()`).

| Table | Primary key |
|-------|-------------|
| `sync_batch` | `batch_id` |
| `engineering_issue` | `(batch_id, issue_key)` |
| `engineering_allocation` | `(batch_id, issue_key, developer)` |
| `engineering_worklog` | `(batch_id, worklog_key)` — idempotent UPSERT |

Worklog identity: prefer `jira:{id}` when Jira worklog id is known; else deterministic `fact:{hash}` (`buildEngineeringWorklogKey`).

Child tables reference `sync_batch(batch_id)` with `ON DELETE CASCADE`.

**No** columns for Engineering Score, Technology Health, Quality Score, or Recovery Score.

---

## Error handling

| Situation | Behavior |
|-----------|----------|
| Missing `DATABASE_URL` | Throw when pool is created |
| Query / constraint failure | Propagate `pg` error to caller |
| Transaction failure | `ROLLBACK`, then rethrow original error |
| `batchId` mismatch on `saveBatch(batchId, rows)` | Throw before write for mismatched rows |
| Schema not applied | Queries fail at runtime until operators apply DDL manually |

Callers (future orchestrator) must treat persistence errors as sync failures and must not mark a batch Completed outside a successful transaction (see 12B).

---

## Future migration strategy

Milestone 13A does **not** run migrations automatically.

Framework in place:

- `persistence/schema/001_initial.sql` + `schema/README.md` (versioning conventions)
- TypeScript DDL mirror in `schema.ts`

Recommended later approach:

1. Treat `001_initial.sql` as applied baseline once run in an environment.
2. Introduce a migration runner that records applied ids in `schema_migrations`.
3. Never embed migration execution inside Next.js page renders.
4. Milestone **13B** (planned): apply schema in controlled environments, wire atomic batch commit into ingest, still without changing analytics formulas.

---

## Dashboard rendering note (`/dashboard` is static)

Build output classifies `/dashboard` as **○ Static**.

### Root cause

`src/app/(dashboard)/dashboard/page.tsx` has:

- No `export const dynamic = "force-dynamic"`
- No `connection()` / cookies / headers / other request-time Next.js APIs
- Synchronous `getDashboardData()` over the **in-memory** latest-snapshot holder

Next.js 16 therefore prerenders `/dashboard` at build time. This is expected for the **current** runtime (warehouse not wired; page has no dynamic IO).

### Intentional for 13A?

**Yes for this milestone’s constraints** — 13A forbids runtime / dashboard behavior changes, so the page remains statically classified.

It is **not** the long-term warehouse-driven target (12B): once the dashboard reads request-time Completed-batch data (or opts into `force-dynamic` / `connection()`), the route should become **ƒ Dynamic**. That cutover is a later milestone — not 13A.

Earlier debug work briefly observed empty dashboard after sync partly because static/module-local memory does not share across isolates; persistence + dynamic rendering are separate follow-ups.

---

## Explicit non-goals (13A)

- Auto-migration on app start
- Orchestrator / engine / dashboard wiring
- Data migration from in-memory snapshot or Jira
- ORM (Prisma / Drizzle)
- Persisting derived metrics
