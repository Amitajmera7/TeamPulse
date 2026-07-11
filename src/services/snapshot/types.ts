/**
 * Analytics Snapshot Engine — type definitions.
 *
 * Sprint 3D Milestone 10A defines the immutable snapshot model that sits
 * between analytics engines and the dashboard.
 *
 * No caching, persistence, or scheduled jobs in this milestone.
 */

import type { DashboardData, ReportingPeriod } from "@/services/dashboard/types";
import type { DeveloperProfile } from "@/services/developer-profile";
import type { TechnologyProfile } from "@/services/technology-profile";

export type { ReportingPeriod };

/** Initial Analytics Snapshot schema version. */
export const ANALYTICS_SNAPSHOT_VERSION = "1.0" as const;

export type AnalyticsSnapshotVersion = typeof ANALYTICS_SNAPSHOT_VERSION;

/**
 * Sync lifecycle status for an analytics calculation run.
 *
 * - Idle — sync has not started
 * - Running — sync is in progress (snapshot not yet consumable by dashboard)
 * - Completed — sync finished successfully (dashboard may consume)
 * - Failed — sync failed (dashboard must keep the previous completed snapshot)
 */
export type SyncStatus = "Idle" | "Running" | "Completed" | "Failed";

/**
 * Metadata describing a single analytics sync run.
 *
 * Produced alongside each {@link AnalyticsSnapshot}. Never mutated in place.
 */
export interface SyncMetadata {
  /** ISO-8601 timestamp when the sync started. */
  readonly syncStartedAt: string;
  /** ISO-8601 timestamp when the sync completed (or failed). */
  readonly syncCompletedAt: string;
  /** Elapsed sync duration in milliseconds. */
  readonly syncDurationMs: number;
  /** Number of Jira issues processed during the sync. */
  readonly totalIssuesProcessed: number;
  /** Number of worklog entries processed during the sync. */
  readonly totalWorklogsProcessed: number;
  /** Lifecycle status of this sync run. */
  readonly status: SyncStatus;
}

/**
 * Immutable analytics snapshot — one completed analytics calculation.
 *
 * Pipeline:
 *   Jira Data → Analytics Engines → Analytics Snapshot → Dashboard
 *
 * The dashboard must consume the latest **Completed** snapshot only.
 * Every sync creates a brand-new snapshot; existing snapshots are never mutated.
 */
export interface AnalyticsSnapshot {
  /** Snapshot schema version. Initial value: "1.0". */
  readonly version: AnalyticsSnapshotVersion;
  /** ISO-8601 timestamp when this snapshot object was assembled. */
  readonly generatedAt: string;
  /** Reporting window covered by this snapshot. */
  readonly reportingPeriod: ReportingPeriod;
  /** Developer profiles produced by the Developer Profile Engine. */
  readonly developerProfiles: readonly DeveloperProfile[];
  /** Technology profiles produced by the Technology Aggregation Engine. */
  readonly technologyProfiles: readonly TechnologyProfile[];
  /**
   * Dashboard projection for UI consumption.
   * Assembled by callers; this milestone stores it without recalculating.
   */
  readonly dashboardData: DashboardData;
  /** Sync run metadata for this snapshot. */
  readonly syncMetadata: SyncMetadata;
}

/** Inputs required to assemble {@link SyncMetadata}. */
export interface BuildSyncMetadataInput {
  syncStartedAt: string;
  syncCompletedAt: string;
  totalIssuesProcessed: number;
  totalWorklogsProcessed: number;
  status: SyncStatus;
}

/** Inputs required to assemble an {@link AnalyticsSnapshot}. */
export interface BuildAnalyticsSnapshotInput {
  /** Optional override; defaults to syncMetadata.syncCompletedAt. */
  generatedAt?: string;
  reportingPeriod: ReportingPeriod;
  developerProfiles: readonly DeveloperProfile[];
  technologyProfiles: readonly TechnologyProfile[];
  dashboardData: DashboardData;
  syncMetadata: SyncMetadata;
}
