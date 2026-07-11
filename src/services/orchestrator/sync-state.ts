/**
 * Live Analytics Sync state (Milestone 11A).
 *
 * Process-local mutable state for progress reporting within the current
 * Node.js process. It is not shared across instances and is lost on restart.
 *
 * Completed Analytics Snapshots remain immutable and are published separately.
 *
 * TODO: Introduce a SyncStateProvider abstraction (in-memory today; Redis /
 * database later) so multi-instance deployments can share sync progress
 * without changing orchestrator call sites. Do not change runtime behavior
 * until that provider is implemented.
 */

import type { SyncStatus } from "@/services/snapshot";

/** Named pipeline steps shown to operators / API consumers. */
export type AnalyticsSyncStep =
  | "Idle"
  | "Fetch Jira"
  | "Resolve Estimates"
  | "Resolve Worklogs"
  | "Build EAW Model"
  | "Validate EAW"
  | "Persist EAW"
  | "Build Developer Profiles"
  | "Build Technology Profiles"
  | "Build DashboardData"
  | "Build Snapshot"
  | "Publish Snapshot";

/** Ordered pipeline steps used for progress calculation. */
export const ANALYTICS_SYNC_STEPS: readonly AnalyticsSyncStep[] = [
  "Fetch Jira",
  "Resolve Estimates",
  "Resolve Worklogs",
  "Build EAW Model",
  "Validate EAW",
  "Persist EAW",
  "Build Developer Profiles",
  "Build Technology Profiles",
  "Build DashboardData",
  "Build Snapshot",
  "Publish Snapshot",
] as const;

/**
 * Live sync progress state (process-local).
 *
 * Distinct from snapshot SyncMetadata — this is the running orchestrator view.
 *
 * TODO: Backed by SyncStateProvider in a future milestone for multi-instance sync.
 */
export interface SyncState {
  status: SyncStatus;
  currentStep: AnalyticsSyncStep;
  startedAt: string | null;
  completedAt: string | null;
  progressPercent: number;
  errorMessage: string | null;
}

const initialSyncState = (): SyncState => ({
  status: "Idle",
  currentStep: "Idle",
  startedAt: null,
  completedAt: null,
  progressPercent: 0,
  errorMessage: null,
});

let syncState: SyncState = initialSyncState();

/**
 * Returns a shallow copy of the current sync state.
 */
export function getSyncState(): SyncState {
  return { ...syncState };
}

/**
 * Resets sync state to Idle.
 */
export function resetSyncState(): void {
  syncState = initialSyncState();
}

/**
 * Marks the sync as Running and records start time.
 */
export function beginSyncState(startedAt: string = new Date().toISOString()): SyncState {
  syncState = {
    status: "Running",
    currentStep: "Fetch Jira",
    startedAt,
    completedAt: null,
    progressPercent: 0,
    errorMessage: null,
  };
  return getSyncState();
}

/**
 * Updates the current pipeline step and progress percent.
 */
export function updateSyncStep(
  step: AnalyticsSyncStep,
  progressPercent: number
): SyncState {
  syncState = {
    ...syncState,
    status: "Running",
    currentStep: step,
    progressPercent: Math.max(0, Math.min(100, progressPercent)),
    errorMessage: null,
  };
  return getSyncState();
}

/**
 * Marks the sync as Completed.
 */
export function completeSyncState(
  completedAt: string = new Date().toISOString()
): SyncState {
  syncState = {
    ...syncState,
    status: "Completed",
    currentStep: "Publish Snapshot",
    completedAt,
    progressPercent: 100,
    errorMessage: null,
  };
  return getSyncState();
}

/**
 * Marks the sync as Failed without clearing prior snapshot publications.
 */
export function failSyncState(
  errorMessage: string,
  completedAt: string = new Date().toISOString()
): SyncState {
  syncState = {
    ...syncState,
    status: "Failed",
    completedAt,
    errorMessage,
  };
  return getSyncState();
}

/**
 * Progress percent for a 1-based step index among {@link ANALYTICS_SYNC_STEPS}.
 */
export function progressForStepIndex(stepIndex: number): number {
  if (stepIndex <= 0) {
    return 0;
  }

  return Math.round((stepIndex / ANALYTICS_SYNC_STEPS.length) * 100);
}
