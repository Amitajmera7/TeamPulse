import { buildSyncMetadata } from "./build-sync-metadata";
import {
  ANALYTICS_SNAPSHOT_VERSION,
  type AnalyticsSnapshot,
  type BuildAnalyticsSnapshotInput,
  type BuildSyncMetadataInput,
  type SyncMetadata,
} from "./types";

/**
 * Assembles an immutable {@link AnalyticsSnapshot}.
 *
 * Every call returns a brand-new frozen snapshot. Inputs are copied into
 * readonly arrays so later mutations of the caller's arrays cannot alter
 * a published snapshot.
 *
 * This milestone creates the snapshot model only:
 * - No caching
 * - No persistence
 * - No scheduled jobs
 * - No analytics recalculation (engines run upstream)
 *
 * Dashboard consumers should read only snapshots with
 * `syncMetadata.status === "Completed"`.
 */
export function buildAnalyticsSnapshot(
  input: BuildAnalyticsSnapshotInput
): AnalyticsSnapshot {
  const generatedAt =
    input.generatedAt ?? input.syncMetadata.syncCompletedAt;

  const snapshot: AnalyticsSnapshot = {
    version: ANALYTICS_SNAPSHOT_VERSION,
    generatedAt,
    reportingPeriod: Object.freeze({ ...input.reportingPeriod }),
    developerProfiles: Object.freeze([...input.developerProfiles]),
    technologyProfiles: Object.freeze([...input.technologyProfiles]),
    dashboardData: Object.freeze({ ...input.dashboardData }),
    syncMetadata: input.syncMetadata,
  };

  return Object.freeze(snapshot);
}

/**
 * Convenience builder: assemble sync metadata then the snapshot in one step.
 *
 * Still pure and immutable — returns a new frozen snapshot every call.
 */
export function buildAnalyticsSnapshotWithSync(
  input: Omit<BuildAnalyticsSnapshotInput, "syncMetadata"> & {
    sync: BuildSyncMetadataInput;
  }
): AnalyticsSnapshot {
  const syncMetadata: SyncMetadata = buildSyncMetadata(input.sync);

  return buildAnalyticsSnapshot({
    generatedAt: input.generatedAt,
    reportingPeriod: input.reportingPeriod,
    developerProfiles: input.developerProfiles,
    technologyProfiles: input.technologyProfiles,
    dashboardData: input.dashboardData,
    syncMetadata,
  });
}
