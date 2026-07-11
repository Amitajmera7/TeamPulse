/**
 * Developer Profile status resolution.
 *
 * Milestone 8B derives status from Engineering Score bands in
 * {@link ENGINEERING_SCORE_CONFIG.statusThresholds}.
 * Recovery never influences status.
 */

import { ENGINEERING_SCORE_CONFIG } from "./config";
import type { DeveloperEvaluation, DeveloperProfileStatus } from "./types";

/**
 * Returns true when the developer has completed engineering work in scope.
 *
 * Signals (any one is sufficient for "has data"):
 * - Contribution completedTasks > 0
 * - Contribution deliveredEngineeringHours > 0
 * - Execution Efficiency resolved
 * - Delivery Quality resolved
 *
 * Recovery alone does not count as completed feature work.
 */
export function hasCompletedWork(evaluation: DeveloperEvaluation): boolean {
  const { contribution, execution, quality } = evaluation;

  if (contribution.completedTasks > 0) {
    return true;
  }

  if (contribution.deliveredEngineeringHours > 0) {
    return true;
  }

  if (execution.resolved) {
    return true;
  }

  if (quality.resolved) {
    return true;
  }

  return false;
}

/**
 * Maps an Engineering Score to a profile status band.
 *
 * Thresholds (from config):
 * | Score        | Status          |
 * |--------------|-----------------|
 * | ≥ 90         | Healthy         |
 * | 75 – 89.99   | Good            |
 * | 60 – 74.99   | Needs Attention |
 * | < 60         | Critical        |
 *
 * Pass `null` for No Data (no completed work / no available KPIs).
 */
export function resolveStatusFromScore(
  score: number | null
): DeveloperProfileStatus {
  if (score === null) {
    return "No Data";
  }

  const { healthy, good, needsAttention } =
    ENGINEERING_SCORE_CONFIG.statusThresholds;

  if (score >= healthy) {
    return "Healthy";
  }

  if (score >= good) {
    return "Good";
  }

  if (score >= needsAttention) {
    return "Needs Attention";
  }

  return "Critical";
}

/**
 * Resolves {@link DeveloperProfileStatus} for a developer evaluation.
 *
 * - "No Data" when the developer has no completed work
 * - Otherwise derived from Engineering Score via {@link resolveStatusFromScore}
 *
 * Prefer calling this with a pre-computed score from
 * {@link calculateEngineeringScore} to avoid duplicate calculation.
 * Recovery never influences status.
 */
export function resolveDeveloperProfileStatus(
  evaluation: DeveloperEvaluation,
  engineeringScore: number | null = null
): DeveloperProfileStatus {
  if (!hasCompletedWork(evaluation)) {
    return "No Data";
  }

  return resolveStatusFromScore(engineeringScore);
}
