/**
 * Analytics Orchestration Engine — end-to-end sync pipeline.
 *
 * Sprint 4A Milestone 11A.
 *
 * Owns: Fetch Jira → resolve → profiles → dashboard → snapshot → publish.
 * Does not embed analytics formulas (delegates to existing engines).
 * On failure, does not replace the previous completed snapshot.
 */

import { fetchDashboardIssues } from "@/services/dashboard/fetch-dashboard-issues";
import { buildDashboardData } from "@/services/dashboard/build-dashboard-data";
import { getReportingPeriod } from "@/services/dashboard/utils";
import { buildTechnologyProfiles } from "@/services/technology-profile";
import type { JiraIssueInput } from "@/services/task-evaluation/task-evaluation";
import { ANALYTICS_SNAPSHOT_VERSION } from "@/services/snapshot";

import {
  assembleDeveloperProfiles,
  countTotalWorklogs,
  resolveEstimatesForIssues,
  resolveWorklogsForRecords,
} from "./assemble-developer-profiles";
import { buildPipelineSnapshot } from "./build-snapshot";
import { publishAnalyticsSnapshot } from "./publish-snapshot";
import {
  beginSyncState,
  completeSyncState,
  failSyncState,
  getSyncState,
  progressForStepIndex,
  updateSyncStep,
  type SyncState,
} from "./sync-state";

export interface AnalyticsSyncResult {
  success: boolean;
  syncState: SyncState;
  snapshotPublished: boolean;
  generatedAt: string | null;
  totalIssuesProcessed: number;
  totalWorklogsProcessed: number;
  errorMessage: string | null;
}

/**
 * Runs the full analytics sync pipeline.
 *
 * Progress is reflected in {@link getSyncState}.
 * A new snapshot is published only after every stage succeeds.
 */
export async function runAnalyticsSync(): Promise<AnalyticsSyncResult> {
  const current = getSyncState();
  if (current.status === "Running") {
    return {
      success: false,
      syncState: current,
      snapshotPublished: false,
      generatedAt: null,
      totalIssuesProcessed: 0,
      totalWorklogsProcessed: 0,
      errorMessage: "Analytics sync is already running.",
    };
  }

  const startedAt = new Date().toISOString();
  beginSyncState(startedAt);

  let totalIssuesProcessed = 0;
  let totalWorklogsProcessed = 0;

  try {
    // 1. Fetch Jira
    updateSyncStep("Fetch Jira", progressForStepIndex(1));
    const rawIssues = await fetchDashboardIssues();
    const issues = rawIssues as JiraIssueInput[];
    totalIssuesProcessed = issues.length;
    totalWorklogsProcessed = countTotalWorklogs(issues);

    // 2. Resolve Estimates
    updateSyncStep("Resolve Estimates", progressForStepIndex(2));
    const estimateRecords = resolveEstimatesForIssues(issues);

    // 3. Resolve Worklogs
    updateSyncStep("Resolve Worklogs", progressForStepIndex(3));
    const resolutionRecords = resolveWorklogsForRecords(estimateRecords);

    // 4. Build Developer Profiles
    updateSyncStep("Build Developer Profiles", progressForStepIndex(4));
    const reportingPeriod = getReportingPeriod();
    const developerProfiles = assembleDeveloperProfiles({
      issues,
      resolutionRecords,
      reportingPeriod,
    });

    // 5. Build Technology Profiles
    updateSyncStep("Build Technology Profiles", progressForStepIndex(5));
    const technologyProfiles = buildTechnologyProfiles(developerProfiles);

    // 6. Build DashboardData directly from profiles (no provisional snapshot)
    updateSyncStep("Build DashboardData", progressForStepIndex(6));
    const dashboardGeneratedAt = new Date().toISOString();
    const dashboardData = buildDashboardData({
      developerProfiles,
      technologyProfiles,
      reportingPeriod,
      generatedAt: dashboardGeneratedAt,
    });

    // 7. Build Snapshot from completed DashboardData
    updateSyncStep("Build Snapshot", progressForStepIndex(7));
    const completedAt = new Date().toISOString();
    const snapshot = buildPipelineSnapshot({
      reportingPeriod,
      developerProfiles,
      technologyProfiles,
      dashboardData,
      syncStartedAt: startedAt,
      syncCompletedAt: completedAt,
      totalIssuesProcessed,
      totalWorklogsProcessed,
    });

    // Guard: versioned immutable snapshot
    if (snapshot.version !== ANALYTICS_SNAPSHOT_VERSION) {
      throw new Error("Snapshot version mismatch.");
    }

    // 8. Publish Snapshot (only after full success)
    updateSyncStep("Publish Snapshot", progressForStepIndex(8));
    const publishResult = publishAnalyticsSnapshot(snapshot);

    if (!publishResult.published) {
      throw new Error("Failed to publish completed Analytics Snapshot.");
    }

    const syncState = completeSyncState(completedAt);

    return {
      success: true,
      syncState,
      snapshotPublished: true,
      generatedAt: publishResult.generatedAt,
      totalIssuesProcessed,
      totalWorklogsProcessed,
      errorMessage: null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown analytics sync failure.";
    const syncState = failSyncState(message);

    return {
      success: false,
      syncState,
      snapshotPublished: false,
      generatedAt: null,
      totalIssuesProcessed,
      totalWorklogsProcessed,
      errorMessage: message,
    };
  }
}
