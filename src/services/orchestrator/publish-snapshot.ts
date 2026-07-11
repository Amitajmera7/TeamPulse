/**
 * Publishes a completed Analytics Snapshot to the latest-snapshot holder.
 *
 * Only Completed snapshots are accepted. Failures must not call this function
 * so the previous completed snapshot remains available to the Dashboard Repository.
 *
 * Also archives a slim history projection for Historical Engineering Analytics.
 */

import {
  buildSnapshotHistoryEntry,
  pushSnapshotHistoryEntry,
} from "@/services/analytics-read/history";
import {
  setLatestCompletedSnapshot,
  type AnalyticsSnapshot,
} from "@/services/snapshot";

export interface PublishSnapshotResult {
  published: boolean;
  generatedAt: string | null;
}

/**
 * Publishes {@link snapshot} as the latest completed Analytics Snapshot.
 *
 * Returns `{ published: false }` when the snapshot is rejected (e.g. not Completed).
 */
export function publishAnalyticsSnapshot(
  snapshot: AnalyticsSnapshot
): PublishSnapshotResult {
  const published = setLatestCompletedSnapshot(snapshot);

  if (published) {
    pushSnapshotHistoryEntry(buildSnapshotHistoryEntry(snapshot));
  }

  return {
    published,
    generatedAt: published ? snapshot.generatedAt : null,
  };
}
