/**
 * Engineering Analytics Warehouse — PostgreSQL schema definitions.
 *
 * Milestone 13A: documentation / DDL constants only.
 * Do NOT execute these statements automatically from application startup.
 *
 * Authoritative migration file (also not auto-run):
 *   persistence/schema/001_initial.sql
 *
 * Keep this module aligned with that file.
 */

/** Logical DDL version for operators (independent of WAREHOUSE_SCHEMA_VERSION on rows). */
export const WAREHOUSE_DDL_VERSION = "1.0" as const;

/** Migration id matching `schema/001_initial.sql` (framework only — not executed). */
export const WAREHOUSE_INITIAL_MIGRATION_ID = "001_initial" as const;

/**
 * Full schema DDL as ordered statements.
 * Mirrors `schema/001_initial.sql`. Safe for manual scripts only.
 */
export const WAREHOUSE_SCHEMA_STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS sync_batch (
  batch_id TEXT PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NULL,
  duration_ms INTEGER NULL,
  status TEXT NOT NULL CHECK (status IN ('Running', 'Completed', 'Failed')),
  issues_processed INTEGER NOT NULL CHECK (issues_processed >= 0),
  worklogs_processed INTEGER NOT NULL CHECK (worklogs_processed >= 0),
  warehouse_schema_version TEXT NOT NULL
)`,

  `CREATE TABLE IF NOT EXISTS engineering_issue (
  batch_id TEXT NOT NULL REFERENCES sync_batch (batch_id) ON DELETE CASCADE,
  issue_key TEXT NOT NULL,
  issue_id TEXT NOT NULL,
  project_key TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  technology TEXT NOT NULL,
  summary TEXT NOT NULL,
  status TEXT NOT NULL,
  issue_status_category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ NULL,
  parent_issue TEXT NULL,
  sprint TEXT NULL,
  month TEXT NOT NULL,
  PRIMARY KEY (batch_id, issue_key)
)`,

  `CREATE INDEX IF NOT EXISTS idx_engineering_issue_issue_key
  ON engineering_issue (issue_key)`,

  `CREATE INDEX IF NOT EXISTS idx_engineering_issue_created_at
  ON engineering_issue (created_at)`,

  `CREATE TABLE IF NOT EXISTS engineering_allocation (
  batch_id TEXT NOT NULL REFERENCES sync_batch (batch_id) ON DELETE CASCADE,
  issue_key TEXT NOT NULL,
  developer TEXT NOT NULL,
  technology TEXT NOT NULL,
  original_estimate_hours DOUBLE PRECISION NOT NULL,
  resolved_estimate_hours DOUBLE PRECISION NOT NULL,
  actual_hours DOUBLE PRECISION NOT NULL,
  worklog_count INTEGER NOT NULL CHECK (worklog_count >= 0),
  PRIMARY KEY (batch_id, issue_key, developer)
)`,

  `CREATE INDEX IF NOT EXISTS idx_engineering_allocation_developer
  ON engineering_allocation (developer)`,

  `CREATE INDEX IF NOT EXISTS idx_engineering_allocation_issue_key
  ON engineering_allocation (issue_key)`,

  `CREATE TABLE IF NOT EXISTS engineering_worklog (
  batch_id TEXT NOT NULL REFERENCES sync_batch (batch_id) ON DELETE CASCADE,
  worklog_key TEXT NOT NULL,
  jira_worklog_id TEXT NULL,
  issue_key TEXT NOT NULL,
  developer TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  hours DOUBLE PRECISION NOT NULL,
  author TEXT NOT NULL,
  PRIMARY KEY (batch_id, worklog_key)
)`,

  `CREATE INDEX IF NOT EXISTS idx_engineering_worklog_batch_id
  ON engineering_worklog (batch_id)`,

  `CREATE INDEX IF NOT EXISTS idx_engineering_worklog_issue_key
  ON engineering_worklog (issue_key)`,

  `CREATE INDEX IF NOT EXISTS idx_engineering_worklog_developer
  ON engineering_worklog (developer)`,

  `CREATE INDEX IF NOT EXISTS idx_engineering_worklog_started_at
  ON engineering_worklog (started_at)`,

  `CREATE INDEX IF NOT EXISTS idx_engineering_worklog_jira_id
  ON engineering_worklog (jira_worklog_id)
  WHERE jira_worklog_id IS NOT NULL`,

  `CREATE INDEX IF NOT EXISTS idx_sync_batch_started_at
  ON sync_batch (started_at)`,

  `CREATE INDEX IF NOT EXISTS idx_sync_batch_status_completed_at
  ON sync_batch (status, completed_at DESC)`,
] as const;

/**
 * Returns the full schema script for operators (not executed by the app).
 */
export function getWarehouseSchemaSql(): string {
  return WAREHOUSE_SCHEMA_STATEMENTS.join(";\n\n") + ";\n";
}
