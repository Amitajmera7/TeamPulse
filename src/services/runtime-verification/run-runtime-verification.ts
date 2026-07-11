/**
 * Runtime Verification — end-to-end reconciliation entry.
 *
 * Sprint 6A Milestone 15.
 * Pure verification: does not mutate sync state, DB, or dashboard runtime.
 */

import type { DashboardData } from "@/services/dashboard/types";
import type { DeveloperProfile } from "@/services/developer-profile";
import type { EngineeringWarehouseModel } from "@/services/engineering-warehouse";
import type { TechnologyProfile } from "@/services/technology-profile";
import type { JiraIssueInput } from "@/services/task-evaluation/task-evaluation";

import { buildVerificationReport } from "./build-verification-report";
import type { VerificationReport } from "./types";
import { verifyAnalyticsCounts } from "./verify-analytics-counts";
import { verifyDashboardCounts } from "./verify-dashboard-counts";
import { verifyEawCounts } from "./verify-eaw-counts";
import { verifyJiraCounts } from "./verify-jira-counts";

export interface RuntimeVerificationInput {
  readonly jiraIssues: readonly JiraIssueInput[];
  readonly eawModel: EngineeringWarehouseModel | null;
  readonly developerProfiles: readonly DeveloperProfile[];
  readonly technologyProfiles: readonly TechnologyProfile[];
  readonly dashboardData: DashboardData;
  readonly reportingPeriod: {
    readonly month: string;
    readonly from: string;
    readonly to: string;
  };
  /** Timestamp used when rebuilding dashboard projection for comparison. */
  readonly generatedAt?: string;
}

/**
 * Runs Jira → EAW → Analytics → Dashboard verification and returns a report.
 */
export function runRuntimeVerification(
  input: RuntimeVerificationInput
): VerificationReport {
  const jira = verifyJiraCounts(input.jiraIssues);
  const eaw = verifyEawCounts(input.eawModel, jira.snapshot);
  const analytics = verifyAnalyticsCounts(
    input.developerProfiles,
    input.technologyProfiles,
    eaw.snapshot
  );
  const dashboard = verifyDashboardCounts({
    dashboardData: input.dashboardData,
    developerProfiles: input.developerProfiles,
    technologyProfiles: input.technologyProfiles,
    reportingPeriod: input.reportingPeriod,
    generatedAt: input.generatedAt ?? input.dashboardData.updatedAt,
  });

  return buildVerificationReport([
    jira.section,
    eaw.section,
    analytics.section,
    dashboard,
  ]);
}
