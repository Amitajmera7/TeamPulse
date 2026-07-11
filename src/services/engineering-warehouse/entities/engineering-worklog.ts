/**
 * EngineeringWorklog — one row per worklog entry.
 *
 * Conceptual fields: IssueKey, Developer, Started, Hours, Author, BatchId,
 * plus identity fields for idempotent warehouse persistence.
 *
 * Atomic time-spent fact. Does not store derived productivity metrics.
 */

import type { BatchId, IsoTimestamp } from "../types";

/**
 * Individual worklog fact ingested from Jira.
 *
 * Ownership: Engineering Analytics Warehouse.
 *
 * Idempotency: {@link worklogKey} is unique within a batch. Prefer
 * `jira:{id}` when {@link jiraWorklogId} is known; otherwise use the
 * deterministic `fact:{hash}` strategy (see persistence/schema/README.md).
 */
export interface EngineeringWorklog {
  /** Batch that ingested this worklog (BatchId). */
  readonly batchId: BatchId;
  /**
   * Stable identity within the batch (WorklogKey).
   * Used as part of the PostgreSQL primary key for idempotent UPSERT.
   */
  readonly worklogKey: string;
  /**
   * Jira worklog id when available at ingest (JiraWorklogId).
   * Null when ingest cannot supply it — use deterministic worklogKey instead.
   */
  readonly jiraWorklogId: string | null;
  /** Issue the worklog belongs to (IssueKey). */
  readonly issueKey: string;
  /** Developer attributed for analytics (Developer). */
  readonly developer: string;
  /** Worklog start timestamp (Started). */
  readonly started: IsoTimestamp;
  /** Hours logged on this entry (Hours). */
  readonly hours: number;
  /** Jira worklog author display name (Author). */
  readonly author: string;
}
