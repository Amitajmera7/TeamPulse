/**
 * Assembles an Analytics Snapshot from pipeline outputs.
 *
 * Pure assembly — does not fetch Jira or publish.
 */

import {
  buildAnalyticsSnapshot,
  buildSyncMetadata,
  type AnalyticsSnapshot,
} from "@/services/snapshot";
import type { DashboardData, ReportingPeriod } from "@/services/dashboard/types";
import type { DeveloperProfile } from "@/services/developer-profile";
import type { TechnologyProfile } from "@/services/technology-profile";

export interface BuildPipelineSnapshotInput {
  reportingPeriod: ReportingPeriod;
  developerProfiles: readonly DeveloperProfile[];
  technologyProfiles: readonly TechnologyProfile[];
  dashboardData: DashboardData;
  syncStartedAt: string;
  syncCompletedAt: string;
  totalIssuesProcessed: number;
  totalWorklogsProcessed: number;
}

/**
 * Builds an immutable Completed Analytics Snapshot for publication.
 */
export function buildPipelineSnapshot(
  input: BuildPipelineSnapshotInput
): AnalyticsSnapshot {
  const syncMetadata = buildSyncMetadata({
    syncStartedAt: input.syncStartedAt,
    syncCompletedAt: input.syncCompletedAt,
    totalIssuesProcessed: input.totalIssuesProcessed,
    totalWorklogsProcessed: input.totalWorklogsProcessed,
    status: "Completed",
  });

  return buildAnalyticsSnapshot({
    generatedAt: input.syncCompletedAt,
    reportingPeriod: input.reportingPeriod,
    developerProfiles: input.developerProfiles,
    technologyProfiles: input.technologyProfiles,
    dashboardData: input.dashboardData,
    syncMetadata,
  });
}
