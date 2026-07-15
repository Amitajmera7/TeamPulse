/**
 * Analytics Orchestration Engine — end-to-end sync pipeline.
 *
 * Sprint 4A Milestone 11A + Sprint 5C EAW ingestion.
 *
 * Owns: Fetch Jira → resolve → EAW validate/persist → profiles → dashboard → snapshot → publish.
 * Does not embed analytics formulas (delegates to existing engines).
 * On failure, does not replace the previous completed snapshot.
 * EAW validation failure aborts before any PostgreSQL write.
 */

import { fetchDashboardIssues } from "@/services/dashboard/fetch-dashboard-issues";
import { buildDashboardData } from "@/services/dashboard/build-dashboard-data";
import { getReportingPeriod } from "@/services/dashboard/utils";
import { buildTechnologyProfiles } from "@/services/technology-profile";
import type { JiraIssueInput } from "@/services/task-evaluation/task-evaluation";
import { ANALYTICS_SNAPSHOT_VERSION } from "@/services/snapshot";
import { validateEngineeringWarehouseModel } from "@/services/engineering-warehouse";
import { saveAnalyticsSnapshot } from "@/services/snapshot-archive";

import {
  assembleDeveloperProfiles,
  countTotalWorklogs,
  resolveEstimatesForIssues,
  resolveWorklogsForRecords,
} from "./assemble-developer-profiles";
import { buildEngineeringWarehouseModel } from "./build-eaw-model";
import { buildPipelineSnapshot } from "./build-snapshot";
import {
  appendOperationsLog,
  recordLastSyncSummary,
} from "./last-sync-summary";
import { persistEngineeringWarehouseBatch } from "./persist-eaw-batch";
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
import { getLatestCompletedSnapshot } from "@/services/snapshot";

export interface AnalyticsSyncResult {
  success: boolean;
  syncState: SyncState;
  snapshotPublished: boolean;
  generatedAt: string | null;
  totalIssuesProcessed: number;
  totalWorklogsProcessed: number;
  errorMessage: string | null;
  /** Present when EAW persistence committed successfully. */
  eawBatchId: string | null;
  eawPersisted: boolean;
}

/**
 * Runs the full analytics sync pipeline.
 *
 * Progress is reflected in {@link getSyncState}.
 * A new snapshot is published only after every stage succeeds.
 * EAW facts are validated then persisted atomically (or not at all).
 */
export async function runAnalyticsSync(): Promise<AnalyticsSyncResult> {
  console.log("******* TEAMPULSE SYNC STARTED ********");
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
      eawBatchId: null,
      eawPersisted: false,
      
    };
  }

  const startedAt = new Date().toISOString();
  beginSyncState(startedAt);
  appendOperationsLog(`[${startedAt}] Sync started`);

  let totalIssuesProcessed = 0;
  let totalWorklogsProcessed = 0;
  let eawBatchId: string | null = null;
  let eawPersisted = false;

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

    // 4. Build EAW Model
    updateSyncStep("Build EAW Model", progressForStepIndex(4));
    const reportingPeriod = getReportingPeriod();
    const eawBuiltAt = new Date().toISOString();
    console.log("[EAW] Build EAW starting");
    const eawModel = buildEngineeringWarehouseModel({
      issues,
      resolutionRecords,
      reportingMonth: reportingPeriod.month,
      startedAt,
      completedAt: eawBuiltAt,
    });
    console.log(
      `[EAW] Build EAW complete batchId=${eawModel.syncBatch.batchId} issues=${eawModel.issues.length} allocations=${eawModel.allocations.length} worklogs=${eawModel.worklogs.length}`
    );

    // 5. Validate EAW (before any DB write)
    updateSyncStep("Validate EAW", progressForStepIndex(5));
    console.log("[EAW] Validate EAW starting");
    const validation = validateEngineeringWarehouseModel(eawModel);
    console.log(
      `[EAW] Validate EAW ${validation.status}\n${validation.summary}`
    );

    if (validation.status === "FAIL") {
      const firstErrors = validation.errors
        .slice(0, 5)
        .map((finding) => `${finding.code}: ${finding.message}`)
        .join("; ");
      throw new Error(
        `EAW validation failed (${validation.errors.length} errors). ${firstErrors}`
      );
    }

    // 6. Persist EAW (atomic transaction)
    updateSyncStep("Persist EAW", progressForStepIndex(6));
    const persistResult = await persistEngineeringWarehouseBatch(eawModel);
    eawBatchId = persistResult.batchId;
    eawPersisted = true;

    // 7. Build Developer Profiles
    updateSyncStep("Build Developer Profiles", progressForStepIndex(7));
    const developerProfiles = assembleDeveloperProfiles({
      issues,
      resolutionRecords,
      reportingPeriod,
    });

    // 8. Build Technology Profiles
    updateSyncStep("Build Technology Profiles", progressForStepIndex(8));
    const technologyProfiles = buildTechnologyProfiles(developerProfiles);

    // 9. Build DashboardData directly from profiles (no provisional snapshot)
    updateSyncStep("Build DashboardData", progressForStepIndex(9));
    const dashboardGeneratedAt = new Date().toISOString();
    const dashboardData = buildDashboardData({
      developerProfiles,
      technologyProfiles,
      reportingPeriod,
      generatedAt: dashboardGeneratedAt,
    });

    // 10. Build Snapshot from completed DashboardData
    updateSyncStep("Build Snapshot", progressForStepIndex(10));
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

    

    const snapshotJson = JSON.stringify(snapshot);
    const bytes = Buffer.byteLength(snapshotJson, "utf8");
    
    console.log("========== SNAPSHOT ==========");
    console.log("Bytes:", bytes);
    console.log("KB:", (bytes / 1024).toFixed(2));
    
    console.log({
      developerProfiles: snapshot.developerProfiles.length,
      technologyProfiles: snapshot.technologyProfiles.length,
      dashboardContributors: snapshot.dashboardData.contributors.length,
      dashboardTechnologies: snapshot.dashboardData.technologies.length,
    });
    
    console.log("==============================");

    // Guard: versioned immutable snapshot
    if (snapshot.version !== ANALYTICS_SNAPSHOT_VERSION) {
      throw new Error("Snapshot version mismatch.");
    }

  // 11. Persist Analytics Snapshot
if (!eawBatchId) {
  throw new Error("Missing batchId for Analytics Snapshot persistence.");
}

await saveAnalyticsSnapshot(eawBatchId, snapshot);

console.log(
  `[SNAPSHOT] Saved batch=${eawBatchId} generatedAt=${snapshot.generatedAt}`
);

// 12. Publish Snapshot
updateSyncStep("Publish Snapshot", progressForStepIndex(11));

const publishResult = publishAnalyticsSnapshot(snapshot);
    
    console.log("========== PUBLISH ==========");
console.log("Published:", publishResult.published);
console.log("Generated At:", publishResult.generatedAt);
console.log("=============================");



const latest = getLatestCompletedSnapshot();

console.log("========== READ BACK ==========");
console.log("Snapshot exists:", latest !== null);

if (latest) {
  console.log("Generated:", latest.generatedAt);
  console.log("Developers:", latest.developerProfiles.length);
}
console.log("===============================");


    if (!publishResult.published) {
      throw new Error("Failed to publish completed Analytics Snapshot.");
    }

    const syncState = completeSyncState(completedAt);

    recordLastSyncSummary({
      syncState,
      success: true,
      issuesProcessed: totalIssuesProcessed,
      worklogsProcessed: totalWorklogsProcessed,
      eawBatchId,
      eawPersisted,
      snapshotPublished: true,
      errorMessage: null,
    });

    return {
      success: true,
      syncState,
      snapshotPublished: true,
      generatedAt: publishResult.generatedAt,
      totalIssuesProcessed,
      totalWorklogsProcessed,
      errorMessage: null,
      eawBatchId,
      eawPersisted,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown analytics sync failure.";
    const syncState = failSyncState(message);

    recordLastSyncSummary({
      syncState,
      success: false,
      issuesProcessed: totalIssuesProcessed,
      worklogsProcessed: totalWorklogsProcessed,
      eawBatchId,
      eawPersisted,
      snapshotPublished: false,
      errorMessage: message,
    });

    return {
      success: false,
      syncState,
      snapshotPublished: false,
      generatedAt: null,
      totalIssuesProcessed,
      totalWorklogsProcessed,
      errorMessage: message,
      eawBatchId,
      eawPersisted,
    };
  }
}
