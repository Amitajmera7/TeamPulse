/**
 * Builds an in-memory Engineering Analytics Warehouse model from sync inputs.
 *
 * Sprint 5C — facts only. Does not calculate Engineering Score or other metrics.
 * Worklogs/allocations are taken from already-resolved orchestrator records so
 * hour totals stay aligned for validation.
 */

import { randomUUID } from "node:crypto";

import { getTechByDeveloper } from "@/services/metrics/get-tech-by-developer";
import { readIssueType } from "@/services/task-evaluation/resolve-estimate";
import type { JiraIssueInput } from "@/services/task-evaluation/task-evaluation";
import {
  WAREHOUSE_SCHEMA_VERSION,
  buildEngineeringWorklogKey,
  type EngineeringAllocation,
  type EngineeringIssue,
  type EngineeringWarehouseModel,
  type EngineeringWorklog,
  type SyncBatch,
} from "@/services/engineering-warehouse";

import type { IssueResolutionRecord } from "./assemble-developer-profiles";

export interface BuildEawModelInput {
  readonly issues: readonly JiraIssueInput[];
  readonly resolutionRecords: readonly IssueResolutionRecord[];
  readonly reportingMonth: string;
  readonly startedAt: string;
  readonly completedAt: string;
  /** Optional override for tests. */
  readonly batchId?: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return null;
}

function readProjectKey(issue: JiraIssueInput): string {
  const fields = asRecord(issue.fields);
  const project = asRecord(fields?.project);
  if (typeof project?.key === "string" && project.key.trim()) {
    return project.key.trim();
  }

  const key = typeof issue.key === "string" ? issue.key : "";
  const dash = key.indexOf("-");
  return dash > 0 ? key.slice(0, dash) : key || "UNKNOWN";
}

function readIssueId(issue: JiraIssueInput): string {
  const id = (issue as { id?: string }).id;
  if (typeof id === "string" && id.trim()) {
    return id.trim();
  }
  return typeof issue.key === "string" ? issue.key : "unknown";
}

function readSummary(issue: JiraIssueInput): string {
  const fields = asRecord(issue.fields);
  return typeof fields?.summary === "string" ? fields.summary : "";
}

function readStatus(issue: JiraIssueInput): string {
  const fields = asRecord(issue.fields);
  const status = asRecord(fields?.status);
  if (typeof status?.name === "string") {
    return status.name;
  }
  return "";
}

function readStatusCategory(issue: JiraIssueInput): string {
  const fields = asRecord(issue.fields);
  const status = asRecord(fields?.status);
  const category = asRecord(status?.statusCategory);
  if (typeof category?.name === "string" && category.name.trim()) {
    return category.name.trim();
  }
  return "Unknown";
}

function readCreated(issue: JiraIssueInput): string {
  const fields = asRecord(issue.fields);
  if (typeof fields?.created === "string" && fields.created) {
    return fields.created;
  }
  return new Date(0).toISOString();
}

function readResolved(issue: JiraIssueInput): string | null {
  const fields = asRecord(issue.fields);
  if (typeof fields?.resolutiondate === "string" && fields.resolutiondate) {
    return fields.resolutiondate;
  }
  return null;
}

function readParentIssue(issue: JiraIssueInput): string | null {
  const fields = asRecord(issue.fields);
  const parent = asRecord(fields?.parent);
  if (typeof parent?.key === "string" && parent.key.trim()) {
    return parent.key.trim();
  }
  return null;
}

function readSprint(issue: JiraIssueInput): string | null {
  const fields = asRecord(issue.fields);
  const sprint = fields?.sprint;
  if (typeof sprint === "string" && sprint.trim()) {
    return sprint.trim();
  }
  if (Array.isArray(sprint) && sprint.length > 0) {
    const first = asRecord(sprint[0]);
    if (typeof first?.name === "string") {
      return first.name;
    }
  }
  return null;
}

function readIssueTechnology(issue: JiraIssueInput): string {
  const classified = readIssueType(issue).trim();
  if (classified) {
    return classified;
  }

  const fields = asRecord(issue.fields);
  const issueType = asRecord(fields?.issuetype);
  if (typeof issueType?.name === "string" && issueType.name.trim()) {
    return issueType.name.trim();
  }

  return "Unknown";
}

/**
 * Builds SyncBatch + issues + allocations + worklogs for one sync.
 */
export function buildEngineeringWarehouseModel(
  input: BuildEawModelInput
): EngineeringWarehouseModel {
  const batchId = input.batchId ?? randomUUID();
  const durationMs = Math.max(
    0,
    Date.parse(input.completedAt) - Date.parse(input.startedAt)
  );

  const issues: EngineeringIssue[] = input.issues.map((issue) => {
    const issueKey =
      typeof issue.key === "string" && issue.key.trim()
        ? issue.key.trim()
        : readIssueId(issue);

    return {
      batchId,
      issueKey,
      issueId: readIssueId(issue),
      projectKey: readProjectKey(issue),
      issueType: readIssueTechnology(issue),
      technology: readIssueTechnology(issue),
      summary: readSummary(issue),
      status: readStatus(issue),
      issueStatusCategory: readStatusCategory(issue),
      created: readCreated(issue),
      resolved: readResolved(issue),
      parentIssue: readParentIssue(issue),
      sprint: readSprint(issue),
      month: input.reportingMonth,
    };
  });

  const worklogs: EngineeringWorklog[] = [];
  const seenKeys = new Set<string>();

  for (const record of input.resolutionRecords) {
    const issueKey =
      typeof record.issue.key === "string" ? record.issue.key : "";

    for (const entry of record.worklogs.worklogs) {
      if (!(entry.hours > 0)) {
        continue;
      }

      const started = entry.startedAt ?? input.startedAt;
      const author = entry.developer;
      // TaskWorklog does not carry Jira worklog id yet — use deterministic fact key.
      const worklogKey = buildEngineeringWorklogKey({
        jiraWorklogId: null,
        issueKey,
        developer: record.developer,
        started,
        hours: entry.hours,
        author,
      });

      if (seenKeys.has(worklogKey)) {
        continue;
      }
      seenKeys.add(worklogKey);

      worklogs.push({
        batchId,
        worklogKey,
        jiraWorklogId: null,
        issueKey,
        developer: record.developer,
        started,
        hours: entry.hours,
        author,
      });
    }
  }

  const worklogTotals = new Map<string, { hours: number; count: number }>();
  for (const worklog of worklogs) {
    const key = `${worklog.issueKey}\0${worklog.developer}`;
    const current = worklogTotals.get(key) ?? { hours: 0, count: 0 };
    current.hours += worklog.hours;
    current.count += 1;
    worklogTotals.set(key, current);
  }

  const allocations: EngineeringAllocation[] = input.resolutionRecords.map(
    (record) => {
      const issueKey =
        typeof record.issue.key === "string" ? record.issue.key : "";
      const technology =
        record.estimate.technology ??
        getTechByDeveloper(record.developer) ??
        "Unknown";
      const totals = worklogTotals.get(`${issueKey}\0${record.developer}`) ?? {
        hours: 0,
        count: 0,
      };

      return {
        batchId,
        developer: record.developer,
        issueKey,
        technology,
        originalEstimateHours: Math.max(0, record.estimate.hours),
        resolvedEstimateHours: Math.max(0, record.estimate.hours),
        actualHours: totals.hours,
        worklogCount: totals.count,
      };
    }
  );

  // Drop allocations with no positive work (keeps cross-entity clean).
  const activeAllocations = allocations.filter(
    (allocation) => allocation.worklogCount > 0 || allocation.actualHours > 0
  );

  const syncBatch: SyncBatch = {
    batchId,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    durationMs: Number.isFinite(durationMs) ? durationMs : null,
    status: "Completed",
    issuesProcessed: issues.length,
    worklogsProcessed: worklogs.length,
    warehouseSchemaVersion: WAREHOUSE_SCHEMA_VERSION,
  };

  return {
    syncBatch,
    issues,
    allocations: activeAllocations,
    worklogs,
  };
}
