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
