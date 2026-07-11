/**
 * In-memory ring buffer of completed sync runs for Operations history.
 *
 * Complements warehouse `sync_batch` rows (successful EAW persists).
 * Failed runs and ops metadata (logs, validation flags) live here only.
 */

import type { LastSyncSummary } from "./last-sync-summary";

const MAX_HISTORY_ENTRIES = 50;

let syncRunHistory: LastSyncSummary[] = [];

/**
 * Builds a stable history id for routing (`/operations/history/[batchId]`).
 * Prefers EAW batch id; otherwise a memory-scoped key.
 */
export function buildSyncHistoryId(summary: LastSyncSummary): string {
  if (summary.eawBatchId) {
    return summary.eawBatchId;
  }

  return `mem:${summary.startedAt ?? "unknown"}:${summary.completedAt ?? "pending"}:${
    summary.success ? "ok" : "fail"
  }`;
}

/**
 * Pushes a completed run snapshot onto the in-memory history (newest first).
 */
export function pushSyncRunHistory(summary: LastSyncSummary): void {
  if (summary.syncStatus === "Idle" && !summary.startedAt) {
    return;
  }

  const snapshot: LastSyncSummary = {
    ...summary,
    logLines: [...summary.logLines],
  };

  const id = buildSyncHistoryId(snapshot);
  const withoutDup = syncRunHistory.filter(
    (entry) => buildSyncHistoryId(entry) !== id
  );

  syncRunHistory = [snapshot, ...withoutDup].slice(0, MAX_HISTORY_ENTRIES);
}

/**
 * Returns in-memory sync history (newest first), copied.
 */
export function getInMemorySyncHistory(): readonly LastSyncSummary[] {
  return syncRunHistory.map((entry) => ({
    ...entry,
    logLines: [...entry.logLines],
  }));
}

/**
 * Finds one in-memory history entry by history id or EAW batch id.
 */
export function findInMemorySyncHistoryById(
  historyId: string
): LastSyncSummary | null {
  const found = syncRunHistory.find(
    (entry) =>
      buildSyncHistoryId(entry) === historyId ||
      entry.eawBatchId === historyId
  );

  if (!found) {
    return null;
  }

  return {
    ...found,
    logLines: [...found.logLines],
  };
}
