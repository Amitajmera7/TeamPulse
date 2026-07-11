/**
 * SyncBatch entity validators.
 */

import type { SyncBatch } from "../entities/sync-batch";
import {
  isFiniteNumber,
  isNonEmptyString,
  parseTimestamp,
  type ValidationCollector,
} from "./collector";

export function validateSyncBatch(
  batch: SyncBatch,
  collector: ValidationCollector
): void {
  if (!isNonEmptyString(batch.batchId)) {
    collector.error(
      "BATCH_ID_MISSING",
      "SyncBatch",
      "batchId must be a non-empty string."
    );
  }

  if (!isNonEmptyString(batch.startedAt)) {
    collector.error(
      "BATCH_STARTED_AT_MISSING",
      "SyncBatch",
      "startedAt must be a non-empty ISO timestamp."
    );
  } else if (parseTimestamp(batch.startedAt) == null) {
    collector.error(
      "BATCH_STARTED_AT_INVALID",
      "SyncBatch",
      `startedAt is not a valid timestamp: ${batch.startedAt}`
    );
  }

  if (!isNonEmptyString(batch.warehouseSchemaVersion)) {
    collector.error(
      "BATCH_SCHEMA_VERSION_MISSING",
      "SyncBatch",
      "warehouseSchemaVersion (schemaVersion) must exist."
    );
  }

  if (!isFiniteNumber(batch.issuesProcessed) || batch.issuesProcessed < 0) {
    collector.error(
      "BATCH_ISSUES_PROCESSED_INVALID",
      "SyncBatch",
      "issuesProcessed must be >= 0."
    );
  }

  if (
    !isFiniteNumber(batch.worklogsProcessed) ||
    batch.worklogsProcessed < 0
  ) {
    collector.error(
      "BATCH_WORKLOGS_PROCESSED_INVALID",
      "SyncBatch",
      "worklogsProcessed must be >= 0."
    );
  }

  if (batch.completedAt != null) {
    if (!isNonEmptyString(batch.completedAt)) {
      collector.error(
        "BATCH_COMPLETED_AT_INVALID",
        "SyncBatch",
        "completedAt must be a non-empty ISO timestamp when present."
      );
    } else {
      const startedMs = parseTimestamp(batch.startedAt);
      const completedMs = parseTimestamp(batch.completedAt);
      if (completedMs == null) {
        collector.error(
          "BATCH_COMPLETED_AT_INVALID",
          "SyncBatch",
          `completedAt is not a valid timestamp: ${batch.completedAt}`
        );
      } else if (startedMs != null && startedMs > completedMs) {
        collector.error(
          "BATCH_TIME_ORDER",
          "SyncBatch",
          "startedAt must be <= completedAt."
        );
      }
    }
  }
}
