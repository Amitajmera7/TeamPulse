import { sumAllSourceWorklogHours } from "../allocation-context";
import {
  gatherDeveloperWorklogs,
  sumWorklogHours,
} from "../parse-worklogs";
import { collectWorklogSources } from "../worklog-sources";
import type { JiraIssueInput } from "../types";
import {
  DELIVERY_QUALITY_PENALTIES,
  type QualityBugRecord,
} from "./types";

/**
 * Computes a developer's proportional share of feature worklog hours.
 *
 * allocationPercentage = developerHours / totalFeatureHours
 */
export function computeAllocationPercentage(
  developerHours: number,
  totalFeatureHours: number
): number | null {
  if (totalFeatureHours <= 0) {
    return null;
  }

  return developerHours / totalFeatureHours;
}

/**
 * Resolves feature worklog hours for allocation.
 */
export function resolveFeatureWorklogHours(
  featureIssue: JiraIssueInput,
  developer: string
): {
  developerHours: number;
  totalFeatureHours: number;
  allocationPercentage: number | null;
} {
  const sources = collectWorklogSources(featureIssue);
  const developerHours = sumWorklogHours(
    gatherDeveloperWorklogs(sources, developer)
  );
  const totalFeatureHours = sumAllSourceWorklogHours(sources);
  const allocationPercentage = computeAllocationPercentage(
    developerHours,
    totalFeatureHours
  );

  return {
    developerHours,
    totalFeatureHours,
    allocationPercentage,
  };
}

/**
 * Calculates full feature-level penalties before proportional allocation.
 */
export function calculateFeaturePenalties(bugs: QualityBugRecord[]): {
  qaBugCount: number;
  uatBugCount: number;
  featureQaPenalty: number;
  featureUatPenalty: number;
  featureTotalPenalty: number;
} {
  const qaBugCount = bugs.filter((bug) => bug.bugType === "QA Bug").length;
  const uatBugCount = bugs.filter((bug) => bug.bugType === "UAT Bug").length;

  const featureQaPenalty = qaBugCount * DELIVERY_QUALITY_PENALTIES.QA_BUG;
  const featureUatPenalty = uatBugCount * DELIVERY_QUALITY_PENALTIES.UAT_BUG;

  return {
    qaBugCount,
    uatBugCount,
    featureQaPenalty,
    featureUatPenalty,
    featureTotalPenalty: featureQaPenalty + featureUatPenalty,
  };
}

/**
 * Allocates feature quality penalties to a developer using worklog share.
 *
 * Example:
 *   QA penalty = 5, developer share = 18/20 → proportional QA penalty = 4.5
 */
export function allocateQualityPenalties(input: {
  featureQaPenalty: number;
  featureUatPenalty: number;
  allocationPercentage: number;
}): {
  qaPenalty: number;
  uatPenalty: number;
  totalPenalty: number;
  proportionalPenalty: number;
} {
  const qaPenalty = input.featureQaPenalty * input.allocationPercentage;
  const uatPenalty = input.featureUatPenalty * input.allocationPercentage;
  const totalPenalty = qaPenalty + uatPenalty;

  return {
    qaPenalty,
    uatPenalty,
    totalPenalty,
    proportionalPenalty: totalPenalty,
  };
}
