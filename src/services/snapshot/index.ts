/**
 * Analytics Snapshot Engine — public module entry.
 *
 * Sprint 3D Milestone 10A defines the immutable snapshot model.
 * Milestone 10C adds an in-memory latest-completed snapshot accessor
 * for the Dashboard Repository.
 */

export {
  buildAnalyticsSnapshot,
  buildAnalyticsSnapshotWithSync,
} from "./build-analytics-snapshot";
export {
  buildSyncMetadata,
  calculateSyncDurationMs,
} from "./build-sync-metadata";
export {
  clearLatestCompletedSnapshot,
  getLatestCompletedSnapshot,
  setLatestCompletedSnapshot,
} from "./latest-snapshot";
export { ANALYTICS_SNAPSHOT_VERSION } from "./types";

export type {
  AnalyticsSnapshot,
  AnalyticsSnapshotVersion,
  BuildAnalyticsSnapshotInput,
  BuildSyncMetadataInput,
  ReportingPeriod,
  SyncMetadata,
  SyncStatus,
} from "./types";

export { recoverLatestSnapshot } from "./recover-latest-snapshot";