/**
 * Dashboard Repository — read-only access to DashboardData for the UI.
 *
 * Sprint 3D Milestone 10C.
 *
 * Pipeline:
 *   Dashboard Page → Dashboard Repository → Analytics Snapshot → DashboardData
 *
 * Does not recalculate analytics or rebuild snapshots.
 * React must not know whether data comes from mock, snapshot, or a future DB.
 */

import type { AnalyticsSnapshot } from "@/services/snapshot";
import { getLatestCompletedSnapshot, recoverLatestSnapshot } from "@/services/snapshot";

import { buildEmptyDashboardData } from "@/services/dashboard/build-empty-dashboard-data";
import type { DashboardData } from "@/services/dashboard/types";


/**
 * Result returned by the Dashboard Repository.
 *
 * `generatedAt` is exposed for future Last Sync display without forcing
 * a header redesign in this milestone.
 */
export interface DashboardRepositoryResult {
  /** Presentation model consumed by React. */
  readonly dashboardData: DashboardData;
  /**
   * Analytics Snapshot generation timestamp.
   * Null when no completed snapshot exists.
   */
  readonly generatedAt: string | null;
}

/**
 * Returns true when a snapshot is safe to serve to the dashboard.
 *
 * Requires Completed sync status and a present dashboardData projection.
 */
export function isUsableAnalyticsSnapshot(
  snapshot: AnalyticsSnapshot | null | undefined
): snapshot is AnalyticsSnapshot {
  if (snapshot == null) {
    return false;
  }

  if (snapshot.syncMetadata?.status !== "Completed") {
    return false;
  }

  if (snapshot.dashboardData == null) {
    return false;
  }

  return true;
}

/**
 * Reads DashboardData from the latest completed Analytics Snapshot.
 *
 * - Returns `snapshot.dashboardData` when a usable snapshot exists.
 * - Returns empty DashboardData when missing / invalid — never throws.
 * - Does not recalculate analytics or rebuild the snapshot.
 */
export async function getDashboardDataFromRepository(): Promise<DashboardRepositoryResult> {
  try {
    await recoverLatestSnapshot();

    const snapshot = getLatestCompletedSnapshot();

    if (!isUsableAnalyticsSnapshot(snapshot)) {
      return {
        dashboardData: buildEmptyDashboardData(),
        generatedAt: null,
      };
    }

    console.log("========== DASHBOARD REPOSITORY ==========");
console.log("Snapshot exists:", snapshot != null);
console.log("Generated:", snapshot.generatedAt);

console.log({
  engineeringScore: snapshot.dashboardData.engineeringScore.value,
  kpis: snapshot.dashboardData.kpis.length,
  contributors: snapshot.dashboardData.contributors.length,
  technologies: snapshot.dashboardData.technologies.length,
  insights: snapshot.dashboardData.insights.length,
});

console.log("=========================================");

return {
  dashboardData: snapshot.dashboardData,
  generatedAt: snapshot.generatedAt,
};
  } catch {
    return {
      dashboardData: buildEmptyDashboardData(),
      generatedAt: null,
    };
  }
}
