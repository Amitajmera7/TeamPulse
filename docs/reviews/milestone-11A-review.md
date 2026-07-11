# Review Checklist

- [ ] Architecture
- [ ] Orchestrator
- [ ] Sync State
- [ ] Snapshot Publishing
- [ ] Error Handling
- [ ] Build Passes

# 1 Objective

Implement the **Analytics Orchestration Engine** for Sprint 4A Milestone 11A. Connect Jira synchronization to Analytics Snapshot publication so that after a successful sync, the Dashboard Repository immediately exposes the latest completed snapshot. Do not redesign UI, optimize performance, schedule jobs, or implement incremental sync.

# 2 Architecture

```
/api/sync  (thin controller)
    ↓
Analytics Orchestrator
    ↓
Fetch Jira → Resolve Estimates → Resolve Worklogs
    ↓
Developer Profiles → Technology Profiles
    ↓
DashboardData → Analytics Snapshot
    ↓
Publish Snapshot
    ↓
Dashboard Repository → React
```

## Why orchestration is isolated from the API

API routes must stay thin HTTP adapters. Pipeline ownership, progress, failure policy, and publication live in the orchestrator so analytics never leak into controllers and the same pipeline can be invoked from jobs later without duplicating logic.

# 3 Pipeline

| # | Step | Action |
|---|------|--------|
| 1 | Fetch Jira | `fetchDashboardIssues()` |
| 2 | Resolve Estimates | `resolveEstimatesForIssues()` via `resolveEstimate` |
| 3 | Resolve Worklogs | `resolveWorklogsForRecords()` via `resolveWorklogs` |
| 4 | Build Developer Profiles | Engines → `buildDeveloperProfile` → dense ranks |
| 5 | Build Technology Profiles | `buildTechnologyProfiles` |
| 6 | Build DashboardData | `buildDashboardData` from profiles + reporting period + generatedAt |
| 7 | Build Snapshot | `buildPipelineSnapshot` from completed DashboardData |
| 8 | Publish Snapshot | `publishAnalyticsSnapshot` → `setLatestCompletedSnapshot` |

Progress: `progressPercent = round(stepIndex / 8 × 100)`.

Failure at any stage → `failSyncState` → **no publish** → previous completed snapshot remains.

# 4 Files Created

| File | Purpose |
|------|---------|
| `src/services/orchestrator/sync-state.ts` | Live SyncState / progress |
| `src/services/orchestrator/assemble-developer-profiles.ts` | Issue → profile assembly |
| `src/services/orchestrator/build-snapshot.ts` | Pipeline snapshot builder |
| `src/services/orchestrator/publish-snapshot.ts` | Publish completed snapshot |
| `src/services/orchestrator/run-analytics-sync.ts` | End-to-end pipeline |
| `src/services/orchestrator/index.ts` | Public exports |
| `docs/reviews/milestone-11A-review.md` | This review package |

# 5 Files Modified

| File | Change |
|------|--------|
| `src/app/api/sync/route.ts` | Thin GET (state) / POST (run sync) |
| `docs/Glossary.md` | Analytics Orchestrator term |
| `docs/Engineering-Metrics-Specification.md` | Orchestrator section |
| `docs/reviews/README.md` | Link milestone-11A-review.md |

# 6 Public Interfaces

```typescript
type AnalyticsSyncStep =
  | "Idle"
  | "Fetch Jira"
  | "Resolve Estimates"
  | "Resolve Worklogs"
  | "Build Developer Profiles"
  | "Build Technology Profiles"
  | "Build DashboardData"
  | "Build Snapshot"
  | "Publish Snapshot";

interface SyncState {
  status: SyncStatus; // Idle | Running | Completed | Failed
  currentStep: AnalyticsSyncStep;
  startedAt: string | null;
  completedAt: string | null;
  progressPercent: number;
  errorMessage: string | null;
}

interface AnalyticsSyncResult {
  success: boolean;
  syncState: SyncState;
  snapshotPublished: boolean;
  generatedAt: string | null;
  totalIssuesProcessed: number;
  totalWorklogsProcessed: number;
  errorMessage: string | null;
}

function runAnalyticsSync(): Promise<AnalyticsSyncResult>;
function getSyncState(): SyncState;
function buildPipelineSnapshot(input: BuildPipelineSnapshotInput): AnalyticsSnapshot;
function publishAnalyticsSnapshot(snapshot: AnalyticsSnapshot): PublishSnapshotResult;
```

# 7 Complete Source Code

## `src/services/orchestrator/sync-state.ts`

```typescript
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
```

## `src/services/orchestrator/build-snapshot.ts`

```typescript
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
```

## `src/services/orchestrator/publish-snapshot.ts`

```typescript
/**
 * Publishes a completed Analytics Snapshot to the latest-snapshot holder.
 *
 * Only Completed snapshots are accepted. Failures must not call this function
 * so the previous completed snapshot remains available to the Dashboard Repository.
 */

import {
  setLatestCompletedSnapshot,
  type AnalyticsSnapshot,
} from "@/services/snapshot";

export interface PublishSnapshotResult {
  published: boolean;
  generatedAt: string | null;
}

/**
 * Publishes {@link snapshot} as the latest completed Analytics Snapshot.
 *
 * Returns `{ published: false }` when the snapshot is rejected (e.g. not Completed).
 */
export function publishAnalyticsSnapshot(
  snapshot: AnalyticsSnapshot
): PublishSnapshotResult {
  const published = setLatestCompletedSnapshot(snapshot);

  return {
    published,
    generatedAt: published ? snapshot.generatedAt : null,
  };
}
```

## `src/services/orchestrator/assemble-developer-profiles.ts`

```typescript
/**
 * Orchestrator assembly — builds Developer Profiles from resolved Jira issues.
 *
 * Uses existing task-evaluation engines. Does not redefine formulas.
 */

import { ELIGIBLE_DEVELOPERS } from "@/config/eligible-developers";
import { isDevelopmentComplete } from "@/config/status-mapping";
import { getTechByDeveloper } from "@/services/metrics/get-tech-by-developer";
import {
  assignDenseRanks,
  buildDeveloperProfile,
  type DeveloperProfile,
} from "@/services/developer-profile";
import type { ReportingPeriod } from "@/services/dashboard/types";
import {
  calculateContribution,
  calculateEfficiencyForIssue,
  calculateQuality,
  calculateRecovery,
  resolveEstimate,
  resolveWorklogs,
  type ExecutionEfficiencyResult,
  type JiraIssueInput,
  type QualityResult,
  type ResolvedEstimate,
  type ResolvedWorklogs,
} from "@/services/task-evaluation/task-evaluation";
import { readIssueStatus } from "@/services/task-evaluation/calculate-contribution";
import { isFeatureWork, isBugWork } from "@/config/issue-types";
import { readIssueType } from "@/services/task-evaluation/resolve-estimate";
import { weightedAverage } from "@/services/technology-profile";

export interface IssueResolutionRecord {
  issue: JiraIssueInput;
  developer: string;
  estimate: ResolvedEstimate;
  worklogs: ResolvedWorklogs;
}

/**
 * Counts worklog entries across issues.
 */
export function countTotalWorklogs(issues: readonly JiraIssueInput[]): number {
  return issues.reduce((total, issue) => {
    const worklogs = (
      issue.fields?.worklog as { worklogs?: unknown[] } | undefined
    )?.worklogs;
    return total + (Array.isArray(worklogs) ? worklogs.length : 0);
  }, 0);
}

/**
 * Resolves estimates for every eligible developer with worklogs on each issue.
 */
export function resolveEstimatesForIssues(
  issues: readonly JiraIssueInput[]
): IssueResolutionRecord[] {
  const records: IssueResolutionRecord[] = [];

  for (const issue of issues) {
    for (const developer of ELIGIBLE_DEVELOPERS) {
      const worklogs = resolveWorklogs(issue, developer);
      if (!worklogs.resolved) {
        continue;
      }

      records.push({
        issue,
        developer,
        estimate: resolveEstimate(issue, developer),
        worklogs,
      });
    }
  }

  return records;
}

/**
 * Ensures worklog resolution is present for estimate records (pipeline step).
 * Re-resolves worklogs so the stage is explicit and deterministic.
 */
export function resolveWorklogsForRecords(
  records: readonly IssueResolutionRecord[]
): IssueResolutionRecord[] {
  return records.map((record) => ({
    ...record,
    worklogs: resolveWorklogs(record.issue, record.developer),
  }));
}

function unresolvedExecution(): ExecutionEfficiencyResult {
  return {
    resolved: false,
    reason: "missing-worklogs",
    allocatedEstimate: 0,
    actualHours: 0,
    variancePercentage: 0,
    tolerancePercentage: 0,
    efficiencyScore: 0,
    rating: "Unresolved",
  };
}

function unresolvedQuality(): QualityResult {
  return {
    resolved: false,
    reason: "feature-not-complete",
    qualityScore: 0,
    qaBugCount: 0,
    uatBugCount: 0,
    qaPenalty: 0,
    uatPenalty: 0,
    totalPenalty: 0,
    proportionalPenalty: 0,
    allocationPercentage: 0,
    rating: "Unresolved",
  };
}

function aggregateExecution(
  records: readonly IssueResolutionRecord[]
): ExecutionEfficiencyResult {
  const resolvedResults: ExecutionEfficiencyResult[] = [];

  for (const record of records) {
    const status = readIssueStatus(record.issue);
    if (!isDevelopmentComplete(status)) {
      continue;
    }

    const result = calculateEfficiencyForIssue(
      record.issue,
      record.estimate,
      record.worklogs
    );

    if (result.resolved) {
      resolvedResults.push(result);
    }
  }

  if (resolvedResults.length === 0) {
    return unresolvedExecution();
  }

  const score = weightedAverage(
    resolvedResults.map((result) => ({
      value: result.efficiencyScore,
      weight: result.actualHours > 0 ? result.actualHours : 1,
    }))
  );

  const allocatedEstimate = resolvedResults.reduce(
    (sum, result) => sum + result.allocatedEstimate,
    0
  );
  const actualHours = resolvedResults.reduce(
    (sum, result) => sum + result.actualHours,
    0
  );

  return {
    resolved: true,
    allocatedEstimate,
    actualHours,
    variancePercentage: 0,
    tolerancePercentage: 0,
    efficiencyScore: score ?? 0,
    rating: "On Track",
  };
}

function collectBugIssues(issues: readonly JiraIssueInput[]): JiraIssueInput[] {
  return issues.filter((issue) => isBugWork(readIssueType(issue)));
}

function collectFeatureIssues(
  issues: readonly JiraIssueInput[]
): JiraIssueInput[] {
  return issues.filter((issue) => {
    if (!isFeatureWork(readIssueType(issue))) {
      return false;
    }
    return isDevelopmentComplete(readIssueStatus(issue));
  });
}

function aggregateQuality(
  developer: string,
  issues: readonly JiraIssueInput[]
): QualityResult {
  const features = collectFeatureIssues(issues);
  const bugs = collectBugIssues(issues);
  const scores: { value: number; weight: number }[] = [];

  let qaBugCount = 0;
  let uatBugCount = 0;
  let qaPenalty = 0;
  let uatPenalty = 0;
  let proportionalPenalty = 0;
  let allocationPercentage = 0;

  for (const feature of features) {
    const result = calculateQuality({
      developer,
      featureIssue: feature,
      linkedBugs: bugs,
    });

    if (!result.resolved) {
      continue;
    }

    const weight =
      result.allocationPercentage > 0 ? result.allocationPercentage : 1;
    scores.push({ value: result.qualityScore, weight });
    qaBugCount += result.qaBugCount;
    uatBugCount += result.uatBugCount;
    qaPenalty += result.qaPenalty;
    uatPenalty += result.uatPenalty;
    proportionalPenalty += result.proportionalPenalty;
    allocationPercentage += result.allocationPercentage;
  }

  if (scores.length === 0) {
    return unresolvedQuality();
  }

  const qualityScore = weightedAverage(scores) ?? 0;

  return {
    resolved: true,
    qualityScore,
    qaBugCount,
    uatBugCount,
    qaPenalty,
    uatPenalty,
    totalPenalty: qaPenalty + uatPenalty,
    proportionalPenalty,
    allocationPercentage:
      scores.length > 0 ? allocationPercentage / scores.length : 0,
    rating: "On Track",
  };
}

/**
 * Builds ranked Developer Profiles for all eligible developers.
 */
export function assembleDeveloperProfiles(input: {
  issues: readonly JiraIssueInput[];
  resolutionRecords: readonly IssueResolutionRecord[];
  reportingPeriod: ReportingPeriod;
}): DeveloperProfile[] {
  const { issues, resolutionRecords, reportingPeriod } = input;
  const profiles: DeveloperProfile[] = [];

  for (const developer of ELIGIBLE_DEVELOPERS) {
    const developerRecords = resolutionRecords.filter(
      (record) => record.developer === developer
    );

    const contribution = calculateContribution({
      developer,
      issues: [...issues],
    });

    const recovery = calculateRecovery({
      developer,
      linkedBugs: collectBugIssues(issues),
    });

    const execution = aggregateExecution(developerRecords);
    const quality = aggregateQuality(developer, issues);
    const technology = getTechByDeveloper(developer) ?? "";

    profiles.push(
      buildDeveloperProfile({
        developer,
        technology,
        reportingPeriod,
        execution,
        quality,
        recovery,
        contribution,
      })
    );
  }

  return assignDenseRanks(profiles);
}
```

## `src/services/orchestrator/run-analytics-sync.ts`

```typescript
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
```

## `src/services/orchestrator/index.ts`

```typescript
/**
 * Analytics Orchestration Engine — public module entry.
 *
 * Sprint 4A Milestone 11A connects Jira synchronization to Analytics Snapshot
 * publication for the Dashboard Repository.
 */

export { buildPipelineSnapshot } from "./build-snapshot";
export type { BuildPipelineSnapshotInput } from "./build-snapshot";
export { publishAnalyticsSnapshot } from "./publish-snapshot";
export type { PublishSnapshotResult } from "./publish-snapshot";
export { runAnalyticsSync } from "./run-analytics-sync";
export type { AnalyticsSyncResult } from "./run-analytics-sync";
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
```

## `src/app/api/sync/route.ts`

```typescript
import { NextResponse } from "next/server";

import {
  getSyncState,
  runAnalyticsSync,
} from "@/services/orchestrator";

/**
 * Returns the current analytics sync state (progress / status).
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    syncState: getSyncState(),
  });
}

/**
 * Triggers the Analytics Orchestration Engine.
 *
 * Thin controller — all pipeline logic lives in the orchestrator.
 */
export async function POST() {
  const result = await runAnalyticsSync();

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        syncState: result.syncState,
        snapshotPublished: result.snapshotPublished,
        generatedAt: result.generatedAt,
        totalIssuesProcessed: result.totalIssuesProcessed,
        totalWorklogsProcessed: result.totalWorklogsProcessed,
        error: result.errorMessage,
      },
      { status: result.syncState.status === "Running" ? 409 : 500 }
    );
  }

  return NextResponse.json({
    success: true,
    syncState: result.syncState,
    snapshotPublished: result.snapshotPublished,
    generatedAt: result.generatedAt,
    totalIssuesProcessed: result.totalIssuesProcessed,
    totalWorklogsProcessed: result.totalWorklogsProcessed,
  });
}
```

# 8 Validation

## Successful sync

`POST /api/sync` → all 8 steps → `snapshotPublished: true` → `getLatestCompletedSnapshot()` returns new snapshot → Dashboard Repository serves `snapshot.dashboardData`.

## Failed sync

Exception mid-pipeline → `status: Failed`, `snapshotPublished: false` → previous completed snapshot untouched.

## Snapshot replacement

Only `publishAnalyticsSnapshot` after full success replaces the latest completed snapshot.

## Progress updates

`GET /api/sync` while running returns `currentStep` + `progressPercent` (12…100).

# 9 Edge Cases

## Jira unavailable

Fetch throws → Failed; no publish; prior snapshot remains (or empty dashboard if none).

## Empty Jira

Pipeline continues with zero issues; profiles still emitted for eligible roster (mostly No Data); snapshot still published if stages succeed.

## Partial failures

Any stage error aborts before publish — dashboard never sees partial analytics.

## Existing snapshot

Failed sync leaves existing completed snapshot in place for the repository.

## No previous snapshot

Failed first sync → repository continues returning empty DashboardData.

# 10 Build Output

```
> teampulse@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 5.1s
  Running TypeScript ...
  Finished TypeScript in 5.1s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/15) ...
The width(-1) and height(-1) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(-1) and height(-1) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
  Generating static pages using 7 workers (3/15) 
  Generating static pages using 7 workers (7/15) 
  Generating static pages using 7 workers (11/15) 
✓ Generating static pages using 7 workers (15/15) in 503ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /ai
├ ○ /analytics
├ ƒ /api/contribution
├ ƒ /api/leaderboard
├ ƒ /api/metrics
├ ƒ /api/sync
├ ○ /dashboard
├ ○ /developers
├ ○ /leaderboard
├ ○ /settings
└ ○ /teams


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

Exit code: 0

# 11 Self Review

**Rating: 8 / 10**

## Known limitations

- Sync state and latest snapshot are process-local (lost on restart).
- Quality aggregation uses all bug issues as linkedBugs (no issue-link graph yet).
- Concurrent sync prevented only within one Node process.

## Future improvements

- Persist sync state + snapshots via SyncStateProvider / snapshot store.
- Scheduled / incremental sync.
- True issue-link based quality scope.
- Stream progress via SSE/WebSocket.

## Technical debt

- `assemble-developer-profiles` is orchestration glue; a dedicated developer-aggregation module could own weighted execution/quality assembly later.
- Dual sync concepts: live `SyncState` (process-local) vs snapshot `SyncMetadata` (intentional; SyncStateProvider TODO documented).
