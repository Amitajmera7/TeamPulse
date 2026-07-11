/**
 * Row ↔ entity mappers for warehouse PostgreSQL repositories.
 * No analytics logic.
 */

import type { EngineeringAllocation } from "../entities/engineering-allocation";
import type { EngineeringIssue } from "../entities/engineering-issue";
import type { EngineeringWorklog } from "../entities/engineering-worklog";
import type { SyncBatch } from "../entities/sync-batch";
import type {
  WarehouseBatchStatus,
  WarehouseSchemaVersion,
} from "../types";

function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function requireIso(value: Date | string): string {
  const iso = toIso(value);
  if (!iso) {
    throw new Error("Expected a non-null timestamp from PostgreSQL.");
  }
  return iso;
}

export interface SyncBatchRow {
  batch_id: string;
  started_at: Date | string;
  completed_at: Date | string | null;
  duration_ms: number | null;
  status: string;
  issues_processed: number;
  worklogs_processed: number;
  warehouse_schema_version: string;
}

export function mapSyncBatchRow(row: SyncBatchRow): SyncBatch {
  return {
    batchId: row.batch_id,
    startedAt: requireIso(row.started_at),
    completedAt: toIso(row.completed_at),
    durationMs: row.duration_ms,
    status: row.status as WarehouseBatchStatus,
    issuesProcessed: row.issues_processed,
    worklogsProcessed: row.worklogs_processed,
    warehouseSchemaVersion:
      row.warehouse_schema_version as WarehouseSchemaVersion,
  };
}

export interface EngineeringIssueRow {
  batch_id: string;
  issue_key: string;
  issue_id: string;
  project_key: string;
  issue_type: string;
  technology: string;
  summary: string;
  status: string;
  issue_status_category: string;
  created_at: Date | string;
  resolved_at: Date | string | null;
  parent_issue: string | null;
  sprint: string | null;
  month: string;
}

export function mapEngineeringIssueRow(row: EngineeringIssueRow): EngineeringIssue {
  return {
    batchId: row.batch_id,
    issueKey: row.issue_key,
    issueId: row.issue_id,
    projectKey: row.project_key,
    issueType: row.issue_type,
    technology: row.technology,
    summary: row.summary,
    status: row.status,
    issueStatusCategory: row.issue_status_category,
    created: requireIso(row.created_at),
    resolved: toIso(row.resolved_at),
    parentIssue: row.parent_issue,
    sprint: row.sprint,
    month: row.month,
  };
}

export interface EngineeringAllocationRow {
  batch_id: string;
  issue_key: string;
  developer: string;
  technology: string;
  original_estimate_hours: number;
  resolved_estimate_hours: number;
  actual_hours: number;
  worklog_count: number;
}

export function mapEngineeringAllocationRow(
  row: EngineeringAllocationRow
): EngineeringAllocation {
  return {
    batchId: row.batch_id,
    issueKey: row.issue_key,
    developer: row.developer,
    technology: row.technology,
    originalEstimateHours: Number(row.original_estimate_hours),
    resolvedEstimateHours: Number(row.resolved_estimate_hours),
    actualHours: Number(row.actual_hours),
    worklogCount: row.worklog_count,
  };
}

export interface EngineeringWorklogRow {
  batch_id: string;
  worklog_key: string;
  jira_worklog_id: string | null;
  issue_key: string;
  developer: string;
  started_at: Date | string;
  hours: number;
  author: string;
}

export function mapEngineeringWorklogRow(
  row: EngineeringWorklogRow
): EngineeringWorklog {
  return {
    batchId: row.batch_id,
    worklogKey: row.worklog_key,
    jiraWorklogId: row.jira_worklog_id,
    issueKey: row.issue_key,
    developer: row.developer,
    started: requireIso(row.started_at),
    hours: Number(row.hours),
    author: row.author,
  };
}
