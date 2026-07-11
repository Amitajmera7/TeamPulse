/**
 * Load a single sync history / batch explorer detail.
 */

import { createPostgresWarehouseRepositories } from "@/services/engineering-warehouse";
import {
  ANALYTICS_SYNC_STEPS,
  buildSyncHistoryId,
  findInMemorySyncHistoryById,
} from "@/services/orchestrator";

import { formatHistoryVerificationReport } from "./format-verification-report";
import {
  memorySummaryToHistoryEntry,
  syncBatchToHistoryEntry,
} from "./map-history-entry";
import type { SyncHistoryDetailResult, SyncHistoryEntry } from "./types";

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

async function loadWarehouseEntry(
  batchId: string
): Promise<{ entry: SyncHistoryEntry | null; available: boolean }> {
  if (!isDatabaseConfigured()) {
    return { entry: null, available: false };
  }

  try {
    const repos = createPostgresWarehouseRepositories();
    const batch = await repos.syncBatches.findByBatch(batchId);
    return {
      entry: batch ? syncBatchToHistoryEntry(batch) : null,
      available: true,
    };
  } catch {
    return { entry: null, available: false };
  }
}

/**
 * Returns Batch Explorer detail for a history id / EAW batch id.
 */
export async function getSyncHistoryDetail(
  historyId: string
): Promise<SyncHistoryDetailResult | null> {
  const decoded = decodeURIComponent(historyId);

  const [{ entry: warehouseEntry, available }, memorySummary] =
    await Promise.all([
      loadWarehouseEntry(decoded),
      Promise.resolve(findInMemorySyncHistoryById(decoded)),
    ]);

  const memoryEntry = memorySummary
    ? memorySummaryToHistoryEntry(
        memorySummary,
        buildSyncHistoryId(memorySummary)
      )
    : null;

  // Prefer memory when both exist (richer ops metadata).
  const entry = memoryEntry ?? warehouseEntry;

  if (!entry) {
    return null;
  }

  const source =
    memoryEntry && warehouseEntry
      ? "merged"
      : memoryEntry
        ? "memory"
        : "warehouse";

  return {
    entry,
    source,
    warehouseAvailable: available,
    verificationReport: formatHistoryVerificationReport(entry),
    pipelineSteps: [...ANALYTICS_SYNC_STEPS],
  };
}
