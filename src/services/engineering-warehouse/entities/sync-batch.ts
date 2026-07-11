/**
 * SyncBatch — one Jira synchronization ingested into the warehouse.
 *
 * Conceptual fields: BatchId, StartedAt, CompletedAt, Duration, Status,
 * IssuesProcessed, WorklogsProcessed, WarehouseSchemaVersion.
 *
 * Does not store derived metrics.
 */

import type {
  BatchId,
  IsoTimestamp,
  WarehouseBatchStatus,
  WarehouseSchemaVersion,
} from "../types";

/**
 * Immutable record of a single warehouse sync batch.
 *
 * Ownership: Engineering Analytics Warehouse (system of record for sync history).
 * Produced by a future warehouse writer; not written in Milestone 12A.
 */
export interface SyncBatch {
  /** Unique ID for this synchronization (BatchId). */
  readonly batchId: BatchId;
  /** When the sync started (StartedAt). */
  readonly startedAt: IsoTimestamp;
  /** When the sync finished or failed (CompletedAt). Null while Running. */
  readonly completedAt: IsoTimestamp | null;
  /** Elapsed duration in milliseconds (Duration). Null while Running. */
  readonly durationMs: number | null;
  /** Batch lifecycle status (Status). */
  readonly status: WarehouseBatchStatus;
  /** Number of Jira issues processed (IssuesProcessed). */
  readonly issuesProcessed: number;
  /** Number of worklog entries processed (WorklogsProcessed). */
  readonly worklogsProcessed: number;
  /** Logical warehouse schema version for this batch (WarehouseSchemaVersion). */
  readonly warehouseSchemaVersion: WarehouseSchemaVersion;
}
