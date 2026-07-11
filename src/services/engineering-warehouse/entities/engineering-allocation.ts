/**
 * EngineeringAllocation — one row per Developer per Issue.
 *
 * Conceptual fields: Developer, Technology, OriginalEstimate, ResolvedEstimate,
 * ActualHours, WorklogCount, BatchId.
 *
 * Stores allocated estimate/effort facts only — never Engineering Score / Quality Score.
 *
 * Quality and recovery facts (QA/UAT bugs, recovery hours) are **not** stored here.
 * Future direction: EngineeringQualityEvent (documented only; not implemented in 12A).
 */

import type { BatchId } from "../types";

/**
 * Developer × issue allocation fact for a sync batch.
 *
 * Ownership: Engineering Analytics Warehouse.
 * Estimates and hours are factual inputs to future analytics engines.
 */
export interface EngineeringAllocation {
  /** Batch that ingested this allocation (BatchId). */
  readonly batchId: BatchId;
  /** Developer display name / identity (Developer). */
  readonly developer: string;
  /** Issue this allocation belongs to (IssueKey). */
  readonly issueKey: string;
  /** Technology attributed to the developer / issue (Technology). */
  readonly technology: string;
  /** Original estimate in hours (OriginalEstimate). */
  readonly originalEstimateHours: number;
  /** Resolved / final estimate in hours (ResolvedEstimate). */
  readonly resolvedEstimateHours: number;
  /** Actual logged hours for this developer on the issue (ActualHours). */
  readonly actualHours: number;
  /** Number of worklog entries for this developer on the issue (WorklogCount). */
  readonly worklogCount: number;
}
