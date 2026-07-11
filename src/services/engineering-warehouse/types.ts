/**
 * Engineering Analytics Warehouse — shared types and schema version.
 *
 * Sprint 5A Milestone 12A (architecture only).
 *
 * The warehouse persists engineering facts, never derived metrics
 * (Engineering Score, Technology Health, Recovery Score, Quality Score, etc.).
 */

/** Initial warehouse logical schema version. */
export const WAREHOUSE_SCHEMA_VERSION = "1.0" as const;

export type WarehouseSchemaVersion = typeof WAREHOUSE_SCHEMA_VERSION;

/**
 * Lifecycle status of a warehouse sync batch.
 *
 * Distinct from Analytics Snapshot SyncMetadata — this describes warehouse ingest.
 */
export type WarehouseBatchStatus =
  | "Running"
  | "Completed"
  | "Failed";

/** Opaque unique identifier for one Jira → warehouse synchronization. */
export type BatchId = string;

/** ISO-8601 timestamp string. */
export type IsoTimestamp = string;

/** Inclusive date-range filter for repository queries. */
export interface DateRange {
  /** ISO-8601 range start (inclusive). */
  readonly from: IsoTimestamp;
  /** ISO-8601 range end (inclusive). */
  readonly to: IsoTimestamp;
}
