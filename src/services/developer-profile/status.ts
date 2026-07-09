/**
 * Developer Profile status resolution.
 *
 * Milestone 8A resolves only the "No Data" case from completed work signals.
 * Score-band statuses (Healthy / Good / Needs Attention / Critical) are
 * reserved for Milestone 8B once Engineering Score exists.
 */

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
 * Resolves {@link DeveloperProfileStatus} for a developer evaluation.
 *
 * Milestone 8A:
 * - "No Data" when the developer has no completed work
 * - "Good" as a neutral placeholder when completed work exists
 *
 * Milestone 8B will replace the placeholder with Engineering Score bands:
 * | Score   | Status          |
 * |---------|-----------------|
 * | 90–100  | Healthy         |
 * | 80–89   | (maps to Healthy / Good per scoring doc) |
 * | 70–79   | Good            |
 * | 60–69   | Needs Attention |
 * | < 60    | Critical        |
 *
 * Recovery never influences status.
 */
export function resolveDeveloperProfileStatus(
  evaluation: DeveloperEvaluation
): DeveloperProfileStatus {
  if (!hasCompletedWork(evaluation)) {
    return "No Data";
  }

  // Extension point (Milestone 8B): derive from Engineering Score.
  // Until then, completed work maps to a neutral "Good" status so profiles
  // remain presentable without inventing a score.
  return "Good";
}
