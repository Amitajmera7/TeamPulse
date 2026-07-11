-- Engineering Analytics Warehouse — initial PostgreSQL schema
-- Migration: 001_initial
-- DDL version: 1.0
--
-- DO NOT run automatically from the Next.js application.
-- Apply manually or via a future migration runner (Milestone 13B+).
--
-- Facts only — no derived metrics (Engineering Score, Technology Health, etc.).

CREATE TABLE IF NOT EXISTS sync_batch (
  batch_id TEXT PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NULL,
  duration_ms INTEGER NULL,
  status TEXT NOT NULL CHECK (status IN ('Running', 'Completed', 'Failed')),
  issues_processed INTEGER NOT NULL CHECK (issues_processed >= 0),
  worklogs_processed INTEGER NOT NULL CHECK (worklogs_processed >= 0),
  warehouse_schema_version TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS engineering_issue (
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
);

CREATE INDEX IF NOT EXISTS idx_engineering_issue_issue_key
  ON engineering_issue (issue_key);

CREATE INDEX IF NOT EXISTS idx_engineering_issue_created_at
  ON engineering_issue (created_at);

CREATE TABLE IF NOT EXISTS engineering_allocation (
  batch_id TEXT NOT NULL REFERENCES sync_batch (batch_id) ON DELETE CASCADE,
  issue_key TEXT NOT NULL,
  developer TEXT NOT NULL,
  technology TEXT NOT NULL,
  original_estimate_hours DOUBLE PRECISION NOT NULL,
  resolved_estimate_hours DOUBLE PRECISION NOT NULL,
  actual_hours DOUBLE PRECISION NOT NULL,
  worklog_count INTEGER NOT NULL CHECK (worklog_count >= 0),
  PRIMARY KEY (batch_id, issue_key, developer)
);

CREATE INDEX IF NOT EXISTS idx_engineering_allocation_developer
  ON engineering_allocation (developer);

CREATE INDEX IF NOT EXISTS idx_engineering_allocation_issue_key
  ON engineering_allocation (issue_key);

-- Worklog identity:
--   worklog_key is unique per batch and enables idempotent UPSERT.
--   Prefer jira:{jiraWorklogId} when Jira worklog id is available at ingest.
--   Otherwise use fact:{deterministic} (see schema/README.md).
CREATE TABLE IF NOT EXISTS engineering_worklog (
  batch_id TEXT NOT NULL REFERENCES sync_batch (batch_id) ON DELETE CASCADE,
  worklog_key TEXT NOT NULL,
  jira_worklog_id TEXT NULL,
  issue_key TEXT NOT NULL,
  developer TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  hours DOUBLE PRECISION NOT NULL,
  author TEXT NOT NULL,
  PRIMARY KEY (batch_id, worklog_key)
);

CREATE INDEX IF NOT EXISTS idx_engineering_worklog_batch_id
  ON engineering_worklog (batch_id);

CREATE INDEX IF NOT EXISTS idx_engineering_worklog_issue_key
  ON engineering_worklog (issue_key);

CREATE INDEX IF NOT EXISTS idx_engineering_worklog_developer
  ON engineering_worklog (developer);

CREATE INDEX IF NOT EXISTS idx_engineering_worklog_started_at
  ON engineering_worklog (started_at);

CREATE INDEX IF NOT EXISTS idx_engineering_worklog_jira_id
  ON engineering_worklog (jira_worklog_id)
  WHERE jira_worklog_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sync_batch_started_at
  ON sync_batch (started_at);

CREATE INDEX IF NOT EXISTS idx_sync_batch_status_completed_at
  ON sync_batch (status, completed_at DESC);
