/**
 * In-memory holder for the latest completed Analytics Snapshot.
 *
 * Milestone 10C: Dashboard Repository reads from here.
 * Sync / persistence writers will call {@link setLatestCompletedSnapshot} later.
 * This module does not calculate analytics.
 */

import type { AnalyticsSnapshot } from "./types";

let latestCompletedSnapshot: AnalyticsSnapshot | null = null;

/**
 * Returns the latest completed Analytics Snapshot, or null when none exists.
 * Read-only accessor for the Dashboard Repository.
 */
export function getLatestCompletedSnapshot(): AnalyticsSnapshot | null {
  return latestCompletedSnapshot;
}

/**
 * Publishes a completed Analytics Snapshot as the latest.
 *
 * Only snapshots with `syncMetadata.status === "Completed"` are accepted.
 * Returns true when the snapshot was stored.
 */
export function setLatestCompletedSnapshot(
  snapshot: AnalyticsSnapshot
): boolean {
  if (snapshot.syncMetadata.status !== "Completed") {
    return false;
  }

  latestCompletedSnapshot = snapshot;
  return true;
}

/**
 * Clears the latest completed snapshot (tests / reset).
 */
export function clearLatestCompletedSnapshot(): void {
  latestCompletedSnapshot = null;
}
