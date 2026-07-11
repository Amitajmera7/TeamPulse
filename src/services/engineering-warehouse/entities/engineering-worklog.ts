/**
 * EngineeringWorklog — one row per worklog entry.
 *
 * Conceptual fields: IssueKey, Developer, Started, Hours, Author, BatchId.
 *
 * Atomic time-spent fact. Does not store derived productivity metrics.
 */

import type { BatchId, IsoTimestamp } from "../types";

/**
 * Individual worklog fact ingested from Jira.
 *
 * Ownership: Engineering Analytics Warehouse.
 */
export interface EngineeringWorklog {
  /** Batch that ingested this worklog (BatchId). */
  readonly batchId: BatchId;
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
