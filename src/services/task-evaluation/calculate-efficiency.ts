import { resolveAllocationDenominatorHours } from "./allocation-context";
import { allocateEstimateHours } from "./allocate-estimate";
import { buildExecutionEfficiencyMetrics } from "./execution-score";
import type {
  ExecutionEfficiencyInput,
  ExecutionEfficiencyResult,
  EfficiencyRating,
  JiraIssueInput,
  ResolvedEstimate,
  ResolvedWorklogs,
} from "./types";

function unresolvedResult(
  reason: ExecutionEfficiencyResult["reason"]
): ExecutionEfficiencyResult {
  return {
    resolved: false,
    reason,
    allocatedEstimate: 0,
    actualHours: 0,
    variancePercentage: 0,
    tolerancePercentage: 0,
    efficiencyScore: 0,
    rating: "Unresolved" satisfies EfficiencyRating,
  };
}

/**
 * Execution Efficiency Engine
 * ===========================
 *
 * Calculates how effectively a developer executed against an allocated
 * engineering estimate.
 *
 * Pipeline:
 * 1. Validate resolved estimate and developer worklogs.
 * 2. Allocate estimate proportionally to developer hours.
 * 3. Compute variance against allocated estimate.
 * 4. Apply dynamic tolerance bands by allocated estimate size.
 * 5. Score linearly outside tolerance (20–100).
 *
 * Estimate allocation
 * -------------------
 * Standard work:
 *   allocated = originalEstimate × (developerHours / totalSubtaskHours)
 *
 * CR / RE work:
 *   allocated = technologyEstimate × (developerHours / totalTechnologyHours)
 *
 * Variance
 * --------
 *   ((actualHours - allocatedEstimate) / allocatedEstimate) × 100
 *
 * Tolerance bands (allocated estimate)
 * ------------------------------------
 *   0–<8 h    → ±5%
 *   8–<40 h   → ±10%
 *   40–<100 h → ±12%
 *   100+ h    → ±15%
 *
 * Scoring
 * -------
 *   Inside tolerance  → score = 100
 *   Outside tolerance → score = max(20, 100 - (|variance| - tolerance))
 */
export function calculateEfficiency(
  input: ExecutionEfficiencyInput
): ExecutionEfficiencyResult {
  const { estimate, worklogs, allocationDenominatorHours } = input;

  if (!estimate.resolved) {
    return unresolvedResult("missing-estimate");
  }

  if (!worklogs.resolved) {
    return unresolvedResult("missing-worklogs");
  }

  const allocatedEstimate = allocateEstimateHours({
    estimateHours: estimate.hours,
    developerHours: worklogs.actualHours,
    denominatorHours: allocationDenominatorHours,
  });

  if (allocatedEstimate === null || allocatedEstimate <= 0) {
    return unresolvedResult("invalid-allocation");
  }

  const metrics = buildExecutionEfficiencyMetrics({
    actualHours: worklogs.actualHours,
    allocatedEstimate,
  });

  if (!metrics) {
    return unresolvedResult("invalid-allocation");
  }

  return {
    resolved: true,
    allocatedEstimate,
    actualHours: worklogs.actualHours,
    variancePercentage: metrics.variancePercentage,
    tolerancePercentage: metrics.tolerancePercentage,
    efficiencyScore: metrics.efficiencyScore,
    rating: metrics.rating,
  };
}

/**
 * Convenience wrapper that resolves allocation denominator hours from a
 * Jira issue payload before calculating execution efficiency.
 */
export function calculateEfficiencyForIssue(
  issue: JiraIssueInput,
  estimate: ResolvedEstimate,
  worklogs: ResolvedWorklogs
): ExecutionEfficiencyResult {
  return calculateEfficiency({
    estimate,
    worklogs,
    allocationDenominatorHours: resolveAllocationDenominatorHours(
      issue,
      estimate
    ),
  });
}
