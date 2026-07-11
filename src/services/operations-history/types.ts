/**
 * Operations sync history types — reuse LastSyncSummary fields.
 */

import type { LastSyncSummary } from "@/services/orchestrator";

export type SyncHistorySource = "warehouse" | "memory" | "merged";

export type SyncHistoryEntrySource = "warehouse" | "memory";

/**
 * One historical sync run for Operations History / Batch Explorer.
 * Reuses {@link LastSyncSummary} — no duplicated business logic.
 */
export interface SyncHistoryEntry extends LastSyncSummary {
  /** Route id for `/operations/history/[batchId]`. */
  readonly historyId: string;
  /** Where this row was primarily loaded from. */
  readonly entrySource: SyncHistoryEntrySource;
}

export interface SyncHistoryPagination {
  readonly limit: number;
  readonly offset: number;
  readonly total: number;
  readonly hasMore: boolean;
}

export interface SyncHistoryListResult {
  readonly entries: readonly SyncHistoryEntry[];
  readonly pagination: SyncHistoryPagination;
  readonly source: SyncHistorySource;
  readonly warehouseAvailable: boolean;
}

export interface SyncHistoryDetailResult {
  readonly entry: SyncHistoryEntry;
  readonly source: SyncHistorySource;
  readonly warehouseAvailable: boolean;
  readonly verificationReport: string;
  readonly pipelineSteps: readonly string[];
}
