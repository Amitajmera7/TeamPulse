# Warehouse PostgreSQL migrations

Status: Framework only (Milestone 13A refinement)  
Owner: TeamPulse

---

## Purpose

Versioned SQL migrations for the Engineering Analytics Warehouse.

**The application must not execute these files on startup.**  
Operators (or a future migration runner in Milestone 13B+) apply them deliberately.

---

## Layout

```
persistence/schema/
  README.md           ← this file
  001_initial.sql     ← initial DDL (tables, indexes, worklog identity)
```

Related TypeScript mirror (documentation constants, also not auto-executed):

- `persistence/schema.ts` → `WAREHOUSE_SCHEMA_STATEMENTS` / `getWarehouseSchemaSql()`

Keep `001_initial.sql` and `schema.ts` aligned when changing DDL.

---

## Versioning

| Convention | Rule |
|------------|------|
| Filename | `{NNN}_{short_snake_name}.sql` — zero-padded sequence |
| Order | Apply in ascending numeric order only |
| Immutability | Never edit a migration that has been applied in any shared environment; add a new file |
| DDL version | Documented in file header and `WAREHOUSE_DDL_VERSION` in `schema.ts` |
| Row schema | `SyncBatch.warehouseSchemaVersion` (`WAREHOUSE_SCHEMA_VERSION`) is independent — stamps fact batches, not DDL |

### Proposed future runner (not implemented)

1. Table `schema_migrations (id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL)`
2. Apply next unrecorded `NNN_*.sql` inside a transaction
3. Record `id = '001_initial'` (or filename stem) after success
4. Never run from React render paths or orchestrator hot path without an explicit ops command

---

## Worklog identity (idempotent saves)

`engineering_worklog` primary key: `(batch_id, worklog_key)`.

### Preferred: Jira Worklog ID

When ingest can supply Jira’s worklog `id`:

```
worklog_key     = "jira:" + jiraWorklogId
jira_worklog_id = jiraWorklogId
```

UPSERT on `(batch_id, worklog_key)` makes re-saves within a batch idempotent.

**Note:** Current TeamPulse task-evaluation `TaskWorklog` / `JiraWorklogEntry` types do **not** yet carry Jira worklog ids. Capturing `id` from the Jira API is an ingest enhancement for a later milestone — not an analytics formula change.

### Fallback: deterministic fact key

When Jira worklog id is unavailable:

```
worklog_key = "fact:" + sha256_hex(
  issueKey + "\0" +
  developer + "\0" +
  started (ISO-8601) + "\0" +
  hours (canonical decimal string) + "\0" +
  author
)
jira_worklog_id = NULL
```

Helper: `buildEngineeringWorklogKey({ jiraWorklogId, issueKey, developer, started, hours, author })` in `worklog-identity.ts`.

Collision risk for the fallback is low for normal Jira data; if two distinct Jira worklogs share the same fact tuple, prefer introducing Jira ids at ingest.

### Repository behavior

`PostgresEngineeringWorklogRepository` uses `INSERT ... ON CONFLICT (batch_id, worklog_key) DO UPDATE` so `saveBatch` / `saveMany` are idempotent for the same identity.

---

## Applying 001 manually (ops)

```bash
psql "$DATABASE_URL" -f src/services/engineering-warehouse/persistence/schema/001_initial.sql
```

Do not wire this into `next build` or `next start`.
