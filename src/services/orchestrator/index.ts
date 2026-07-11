/**
 * Analytics Orchestration Engine — public module entry.
 *
 * Sprint 4A Milestone 11A connects Jira synchronization to Analytics Snapshot
 * publication for the Dashboard Repository.
 */

export { buildEngineeringWarehouseModel } from "./build-eaw-model";
export type { BuildEawModelInput } from "./build-eaw-model";
export { persistEngineeringWarehouseBatch } from "./persist-eaw-batch";
export type { PersistEawBatchResult } from "./persist-eaw-batch";
export { buildPipelineSnapshot } from "./build-snapshot";
export type { BuildPipelineSnapshotInput } from "./build-snapshot";
export { publishAnalyticsSnapshot } from "./publish-snapshot";
export type { PublishSnapshotResult } from "./publish-snapshot";
export { runAnalyticsSync } from "./run-analytics-sync";
export type { AnalyticsSyncResult } from "./run-analytics-sync";
export {
  getLastSyncSummary,
  recordLastSyncSummary,
  appendOperationsLog,
  mirrorLiveSyncState,
} from "./last-sync-summary";
export type {
  LastSyncSummary,
  ValidationOpsStatus,
  WarehouseOpsStatus,
  AnalyticsOpsStatus,
} from "./last-sync-summary";
export {
  ANALYTICS_SYNC_STEPS,
  beginSyncState,
  completeSyncState,
  failSyncState,
  getSyncState,
  progressForStepIndex,
  resetSyncState,
  updateSyncStep,
} from "./sync-state";
export type { AnalyticsSyncStep, SyncState } from "./sync-state";
