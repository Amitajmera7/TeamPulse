import type { BuildSyncMetadataInput, SyncMetadata } from "./types";

/**
 * Computes sync duration in milliseconds from start/end ISO timestamps.
 *
 * Returns 0 when either timestamp is invalid or completedAt precedes startedAt.
 */
export function calculateSyncDurationMs(
  syncStartedAt: string,
  syncCompletedAt: string
): number {
  const started = Date.parse(syncStartedAt);
  const completed = Date.parse(syncCompletedAt);

  if (Number.isNaN(started) || Number.isNaN(completed)) {
    return 0;
  }

  return Math.max(0, completed - started);
}

/**
 * Assembles immutable {@link SyncMetadata} for one analytics sync run.
 *
 * Pure — does not perform I/O or mutate inputs.
 * Duration is derived from start/end timestamps (never hardcoded).
 */
export function buildSyncMetadata(
  input: BuildSyncMetadataInput
): SyncMetadata {
  const metadata: SyncMetadata = {
    syncStartedAt: input.syncStartedAt,
    syncCompletedAt: input.syncCompletedAt,
    syncDurationMs: calculateSyncDurationMs(
      input.syncStartedAt,
      input.syncCompletedAt
    ),
    totalIssuesProcessed: input.totalIssuesProcessed,
    totalWorklogsProcessed: input.totalWorklogsProcessed,
    status: input.status,
  };

  return Object.freeze(metadata);
}
