/**
 * Last sync summary for Operations & Sync Center.
 *
 * Operational metadata only — does not affect analytics formulas.
 */

import type { AnalyticsSyncStep, SyncState } from "./sync-state";
import type { SyncStatus } from "@/services/snapshot";
import { pushSyncRunHistory } from "./sync-run-history";

export type ValidationOpsStatus = "PASS" | "FAIL" | "Unknown" | "Not Run";
export type WarehouseOpsStatus = "Persisted" | "Not Persisted" | "Unknown";
export type AnalyticsOpsStatus = "Published" | "Not Published" | "Unknown";

export interface LastSyncSummary {
  readonly success: boolean;
  readonly syncStatus: SyncStatus;
  readonly currentStep: AnalyticsSyncStep;
  readonly progressPercent: number;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly durationMs: number | null;
  readonly issuesProcessed: number;
  readonly worklogsProcessed: number;
  readonly eawBatchId: string | null;
  readonly eawPersisted: boolean;
  readonly snapshotPublished: boolean;
  readonly validationStatus: ValidationOpsStatus;
  readonly warehouseStatus: WarehouseOpsStatus;
  readonly analyticsStatus: AnalyticsOpsStatus;
  readonly errorMessage: string | null;
  /** Rolling log lines for the Operations page (newest last). */
  readonly logLines: readonly string[];
}

const MAX_LOG_LINES = 40;

let lastSyncSummary: LastSyncSummary = {
  success: false,
  syncStatus: "Idle",
  currentStep: "Idle",
  progressPercent: 0,
  startedAt: null,
  completedAt: null,
  durationMs: null,
  issuesProcessed: 0,
  worklogsProcessed: 0,
  eawBatchId: null,
  eawPersisted: false,
  snapshotPublished: false,
  validationStatus: "Not Run",
  warehouseStatus: "Unknown",
  analyticsStatus: "Unknown",
  errorMessage: null,
  logLines: [],
};

function durationMs(
  startedAt: string | null,
  completedAt: string | null
): number | null {
  if (!startedAt || !completedAt) {
    return null;
  }
  const ms = Date.parse(completedAt) - Date.parse(startedAt);
  return Number.isFinite(ms) ? Math.max(0, ms) : null;
}

function inferValidationStatus(errorMessage: string | null, success: boolean): ValidationOpsStatus {
  if (success) {
    return "PASS";
  }
  if (errorMessage?.includes("EAW validation failed")) {
    return "FAIL";
  }
  if (errorMessage) {
    return "Unknown";
  }
  return "Not Run";
}

/**
 * Returns a copy of the last sync summary for the Operations Center.
 */
export function getLastSyncSummary(): LastSyncSummary {
  return {
    ...lastSyncSummary,
    logLines: [...lastSyncSummary.logLines],
  };
}

/**
 * Appends an operations log line (capped).
 */
export function appendOperationsLog(line: string): void {
  const next = [...lastSyncSummary.logLines, line];
  lastSyncSummary = {
    ...lastSyncSummary,
    logLines: next.slice(-MAX_LOG_LINES),
  };
}

/**
 * Records the outcome of a sync run for Operations visibility.
 */
export function recordLastSyncSummary(input: {
  syncState: SyncState;
  success: boolean;
  issuesProcessed: number;
  worklogsProcessed: number;
  eawBatchId: string | null;
  eawPersisted: boolean;
  snapshotPublished: boolean;
  errorMessage: string | null;
}): void {
  const { syncState } = input;
  const startedAt = syncState.startedAt;
  const completedAt = syncState.completedAt;
  const validationStatus = inferValidationStatus(
    input.errorMessage,
    input.success
  );

  const warehouseStatus: WarehouseOpsStatus = input.eawPersisted
    ? "Persisted"
    : input.errorMessage?.includes("EAW validation failed")
      ? "Not Persisted"
      : input.success
        ? "Not Persisted"
        : lastSyncSummary.eawPersisted
          ? "Persisted"
          : "Not Persisted";

  const analyticsStatus: AnalyticsOpsStatus = input.snapshotPublished
    ? "Published"
    : "Not Published";

  const stamp = new Date().toISOString();
  const outcomeLine = input.success
    ? `[${stamp}] Sync Completed — EAW ${input.eawBatchId ?? "n/a"} — snapshot published`
    : `[${stamp}] Sync Failed — ${input.errorMessage ?? "unknown error"}`;

  lastSyncSummary = {
    success: input.success,
    syncStatus: syncState.status,
    currentStep: syncState.currentStep,
    progressPercent: syncState.progressPercent,
    startedAt,
    completedAt,
    durationMs: durationMs(startedAt, completedAt),
    issuesProcessed: input.issuesProcessed,
    worklogsProcessed: input.worklogsProcessed,
    eawBatchId: input.eawBatchId,
    eawPersisted: input.eawPersisted,
    snapshotPublished: input.snapshotPublished,
    validationStatus,
    warehouseStatus: input.eawPersisted
      ? "Persisted"
      : warehouseStatus,
    analyticsStatus,
    errorMessage: input.errorMessage,
    logLines: [...lastSyncSummary.logLines, outcomeLine].slice(-MAX_LOG_LINES),
  };

  pushSyncRunHistory(lastSyncSummary);
}

/**
 * Mirrors live sync state into the summary while a run is in progress.
 */
export function mirrorLiveSyncState(syncState: SyncState): void {
  lastSyncSummary = {
    ...lastSyncSummary,
    syncStatus: syncState.status,
    currentStep: syncState.currentStep,
    progressPercent: syncState.progressPercent,
    startedAt: syncState.startedAt ?? lastSyncSummary.startedAt,
    completedAt: syncState.completedAt,
    errorMessage: syncState.errorMessage,
  };
}
