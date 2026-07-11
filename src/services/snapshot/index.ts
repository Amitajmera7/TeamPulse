/**
 * Analytics Snapshot Engine — public module entry.
 *
 * Sprint 3D Milestone 10A defines the immutable snapshot model between
 * analytics engines and the dashboard.
 *
 * Does not modify React components, dashboard UI, or dashboard-mock.
 * Does not implement caching, persistence, or scheduled jobs.
 */

export {
  buildAnalyticsSnapshot,
  buildAnalyticsSnapshotWithSync,
} from "./build-analytics-snapshot";
export {
  buildSyncMetadata,
  calculateSyncDurationMs,
} from "./build-sync-metadata";
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
