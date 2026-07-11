/**
 * EngineeringIssue — normalized Jira issue metadata (engineering fact).
 *
 * Conceptual fields: IssueKey, IssueId, IssueType, ProjectKey, Technology,
 * Summary, Status, IssueStatusCategory, Created, Resolved, ParentIssue,
 * Sprint, Month.
 *
 * Does not store Engineering Score or other derived metrics.
 */

import type { BatchId, IsoTimestamp } from "../types";

/**
 * Normalized issue metadata retained for historical analytics.
 *
 * Ownership: Engineering Analytics Warehouse.
 * Source of truth for operational fields remains Jira; this is an analytics copy.
 */
export interface EngineeringIssue {
  /** Batch that ingested this issue row (BatchId). */
  readonly batchId: BatchId;
  /** Jira issue key, e.g. "PROJ-123" (IssueKey). */
  readonly issueKey: string;
  /** Jira internal issue id (IssueId). */
  readonly issueId: string;
  /** Jira project key extracted from the issue, e.g. "PROJ" (ProjectKey). */
  readonly projectKey: string;
  /** Jira issue type name (IssueType). */
  readonly issueType: string;
  /** Technology discipline attributed to the issue (Technology). */
  readonly technology: string;
  /** Issue summary / title (Summary). */
  readonly summary: string;
  /** Jira workflow status at ingest time (Status). */
  readonly status: string;
  /**
   * Jira status category at ingest time (IssueStatusCategory).
   * Typical values: "To Do" | "In Progress" | "Done" (string for forward compatibility).
   */
  readonly issueStatusCategory: string;
  /** Issue created timestamp (Created). */
  readonly created: IsoTimestamp;
  /** Issue resolved timestamp (Resolved). Null if unresolved. */
  readonly resolved: IsoTimestamp | null;
  /** Parent issue key when applicable (ParentIssue). */
  readonly parentIssue: string | null;
  /** Sprint name or id label when applicable (Sprint). */
  readonly sprint: string | null;
  /**
   * Reporting month label for the issue, e.g. "July 2026" (Month).
   * Fact used for period bucketing — not a derived score.
   */
  readonly month: string;
}
