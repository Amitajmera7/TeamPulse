/**
 * Load sync history from warehouse when available; merge with in-memory runs.
 */

import { createPostgresWarehouseRepositories } from "@/services/engineering-warehouse";
import {
  buildSyncHistoryId,
  getInMemorySyncHistory,
} from "@/services/orchestrator";

import {
  memorySummaryToHistoryEntry,
  syncBatchToHistoryEntry,
} from "./map-history-entry";
import type {
  SyncHistoryEntry,
  SyncHistoryListResult,
  SyncHistorySource,
} from "./types";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
/** Fetch enough warehouse rows to merge before slicing (pagination-ready). */
const WAREHOUSE_FETCH_CAP = 200;

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function mergeHistoryEntries(
  warehouse: readonly SyncHistoryEntry[],
  memory: readonly SyncHistoryEntry[]
): SyncHistoryEntry[] {
  const byId = new Map<string, SyncHistoryEntry>();

  for (const entry of warehouse) {
    byId.set(entry.historyId, entry);
  }

  // Memory wins on collision (richer ops fields: logs, analytics, errors).
  for (const entry of memory) {
    byId.set(entry.historyId, entry);
  }

  return [...byId.values()].sort((a, b) => {
    const aTime = a.startedAt ? Date.parse(a.startedAt) : 0;
    const bTime = b.startedAt ? Date.parse(b.startedAt) : 0;
    return bTime - aTime;
  });
}

async function loadWarehouseEntries(): Promise<{
  entries: SyncHistoryEntry[];
  available: boolean;
}> {
  if (!isDatabaseConfigured()) {
    return { entries: [], available: false };
  }

  try {
    const repos = createPostgresWarehouseRepositories();
    const batches = await repos.syncBatches.findRecent(WAREHOUSE_FETCH_CAP, 0);
    return {
      entries: batches.map(syncBatchToHistoryEntry),
      available: true,
    };
  } catch {
    return { entries: [], available: false };
  }
}

function loadMemoryEntries(): SyncHistoryEntry[] {
  return getInMemorySyncHistory().map((summary) =>
    memorySummaryToHistoryEntry(summary, buildSyncHistoryId(summary))
  );
}

function resolveSource(
  warehouseAvailable: boolean,
  warehouseCount: number,
  memoryCount: number
): SyncHistorySource {
  if (warehouseAvailable && warehouseCount > 0 && memoryCount > 0) {
    return "merged";
  }
  if (warehouseAvailable && warehouseCount > 0) {
    return "warehouse";
  }
  return "memory";
}

/**
 * Lists sync history newest-first with offset/limit pagination.
 */
export async function listSyncHistory(options?: {
  limit?: number;
  offset?: number;
}): Promise<SyncHistoryListResult> {
  const limit = Math.max(
    1,
    Math.min(options?.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
  );
  const offset = Math.max(0, options?.offset ?? 0);

  const [{ entries: warehouseEntries, available }, memoryEntries] =
    await Promise.all([
      loadWarehouseEntries(),
      Promise.resolve(loadMemoryEntries()),
    ]);

  const merged = mergeHistoryEntries(warehouseEntries, memoryEntries);
  const total = merged.length;
  const page = merged.slice(offset, offset + limit);

  return {
    entries: page,
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + limit < total,
    },
    source: resolveSource(
      available,
      warehouseEntries.length,
      memoryEntries.length
    ),
    warehouseAvailable: available,
  };
}
