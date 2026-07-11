/**
 * Maps warehouse SyncBatch facts → SyncHistoryEntry (ops projection only).
 */

import type { SyncBatch } from "@/services/engineering-warehouse";
import type { LastSyncSummary } from "@/services/orchestrator";
import type { SyncHistoryEntry } from "./types";

/**
 * Projects a persisted SyncBatch into the shared ops summary shape.
 * Does not recalculate analytics — warehouse facts only + inferred ops flags.
 */
export function syncBatchToHistoryEntry(batch: SyncBatch): SyncHistoryEntry {
  const success = batch.status === "Completed";
  const failed = batch.status === "Failed";

  const summary: LastSyncSummary = {
    success,
    syncStatus: batch.status === "Running" ? "Running" : success ? "Completed" : "Failed",
    currentStep: success ? "Publish Snapshot" : failed ? "Persist EAW" : "Idle",
    progressPercent: success ? 100 : failed ? 50 : 0,
    startedAt: batch.startedAt,
    completedAt: batch.completedAt,
    durationMs: batch.durationMs,
    issuesProcessed: batch.issuesProcessed,
    worklogsProcessed: batch.worklogsProcessed,
    eawBatchId: batch.batchId,
    eawPersisted: success,
    snapshotPublished: false,
    validationStatus: success ? "PASS" : failed ? "FAIL" : "Unknown",
    warehouseStatus: success ? "Persisted" : "Not Persisted",
    analyticsStatus: "Unknown",
    errorMessage: null,
    logLines: [],
  };

  return {
    ...summary,
    historyId: batch.batchId,
    entrySource: "warehouse",
  };
}

/**
 * Wraps an in-memory LastSyncSummary as a history entry.
 */
export function memorySummaryToHistoryEntry(
  summary: LastSyncSummary,
  historyId: string
): SyncHistoryEntry {
  return {
    ...summary,
    logLines: [...summary.logLines],
    historyId,
    entrySource: "memory",
  };
}
