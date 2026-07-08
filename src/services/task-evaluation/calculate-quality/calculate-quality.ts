import { isDevelopmentComplete } from "@/config/status-mapping";

import { readIssueType } from "../resolve-estimate";
import {
  allocateQualityPenalties,
  calculateFeaturePenalties,
  resolveFeatureWorklogHours,
} from "./allocate-quality-penalty";
import { collectQualityBugs } from "./bug-sources";
import {
  BASE_QUALITY_SCORE,
  calculateQualityScore,
  resolveQualityRating,
} from "./quality-score";
import type { QualityInput, QualityReason, QualityResult } from "./types";

function readFeatureStatus(issue: QualityInput["featureIssue"]): string {
  const status = issue.fields?.status as { name?: string } | undefined;
  return status?.name ?? "";
}

function unresolvedResult(reason: QualityReason): QualityResult {
  return {
    resolved: false,
    reason,
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

/**
 * Delivery Quality Engine
 * =======================
 *
 * Measures engineering stability for a developer on a completed feature by
 * applying proportional QA / UAT bug penalties to a base score of 100.
 *
 * Pipeline:
 * 1. Verify feature work is development complete.
 * 2. Resolve feature worklog distribution for the developer.
 * 3. Collect QA / UAT bugs with worklogs (reopened bugs deduped by key).
 * 4. Calculate feature-level penalties (QA = 5, UAT = 8).
 * 5. Allocate penalties proportionally by feature worklog share.
 * 6. qualityScore = clamp(100 - proportionalPenalty, 20, 100)
 */
export function calculateQuality(input: QualityInput): QualityResult {
  const { developer, featureIssue, linkedBugs } = input;

  if (!isDevelopmentComplete(readFeatureStatus(featureIssue))) {
    return unresolvedResult("feature-not-complete");
  }

  const { allocationPercentage } = resolveFeatureWorklogHours(
    featureIssue,
    developer
  );

  if (allocationPercentage === null) {
    return unresolvedResult("missing-feature-worklogs");
  }

  const bugs = collectQualityBugs(linkedBugs);
  const {
    qaBugCount,
    uatBugCount,
    featureQaPenalty,
    featureUatPenalty,
  } = calculateFeaturePenalties(bugs);

  const allocated = allocateQualityPenalties({
    featureQaPenalty,
    featureUatPenalty,
    allocationPercentage,
  });

  const qualityScore = calculateQualityScore(allocated.proportionalPenalty);

  return {
    resolved: true,
    qualityScore,
    qaBugCount,
    uatBugCount,
    qaPenalty: allocated.qaPenalty,
    uatPenalty: allocated.uatPenalty,
    totalPenalty: allocated.totalPenalty,
    proportionalPenalty: allocated.proportionalPenalty,
    allocationPercentage,
    rating: resolveQualityRating(qualityScore),
  };
}

/**
 * Returns the base delivery quality score before penalties are applied.
 */
export function getBaseQualityScore(): number {
  return BASE_QUALITY_SCORE;
}

/**
 * Reads the TeamPulse issue classification for a feature work item.
 */
export function getFeatureIssueType(
  featureIssue: QualityInput["featureIssue"]
): string {
  return readIssueType(featureIssue);
}
