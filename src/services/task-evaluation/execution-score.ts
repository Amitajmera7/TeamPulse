import type { EfficiencyRating } from "./types";
import {
  isWithinTolerance,
  resolveTolerancePercentage,
} from "./execution-tolerance";

const MIN_EFFICIENCY_SCORE = 20;
const MAX_EFFICIENCY_SCORE = 100;

/**
 * Calculates estimate variance as a percentage of allocated estimate.
 *
 * Formula:
 *   ((actualHours - allocatedEstimate) / allocatedEstimate) × 100
 *
 * Positive variance indicates overrun; negative variance indicates finishing
 * below the allocated estimate.
 */
export function calculateVariancePercentage(
  actualHours: number,
  allocatedEstimate: number
): number | null {
  if (allocatedEstimate <= 0) {
    return null;
  }

  return ((actualHours - allocatedEstimate) / allocatedEstimate) * 100;
}

/**
 * Calculates execution efficiency score from variance and tolerance.
 *
 * Within tolerance:
 *   efficiencyScore = 100
 *
 * Outside tolerance:
 *   excess = |variance| - tolerance
 *   efficiencyScore = clamp(100 - excess, 20, 100)
 *
 * The score decreases linearly by one point per excess variance percentage.
 */
export function calculateEfficiencyScore(
  variancePercentage: number,
  tolerancePercentage: number
): number {
  if (isWithinTolerance(variancePercentage, tolerancePercentage)) {
    return MAX_EFFICIENCY_SCORE;
  }

  const excess = Math.abs(variancePercentage) - tolerancePercentage;
  return Math.max(
    MIN_EFFICIENCY_SCORE,
    Math.min(MAX_EFFICIENCY_SCORE, MAX_EFFICIENCY_SCORE - excess)
  );
}

/**
 * Maps an execution efficiency score to a human-readable rating band.
 */
export function resolveEfficiencyRating(
  efficiencyScore: number
): EfficiencyRating {
  if (efficiencyScore >= 90) {
    return "Excellent";
  }

  if (efficiencyScore >= 75) {
    return "Very Good";
  }

  if (efficiencyScore >= 60) {
    return "On Track";
  }

  if (efficiencyScore >= 40) {
    return "Needs Improvement";
  }

  return "Critical Overrun";
}

/**
 * Computes variance, tolerance, score, and rating for a resolved evaluation.
 */
export function buildExecutionEfficiencyMetrics(input: {
  actualHours: number;
  allocatedEstimate: number;
}): {
  variancePercentage: number;
  tolerancePercentage: number;
  efficiencyScore: number;
  rating: EfficiencyRating;
} | null {
  const variancePercentage = calculateVariancePercentage(
    input.actualHours,
    input.allocatedEstimate
  );

  if (variancePercentage === null) {
    return null;
  }

  const tolerancePercentage = resolveTolerancePercentage(
    input.allocatedEstimate
  );
  const efficiencyScore = calculateEfficiencyScore(
    variancePercentage,
    tolerancePercentage
  );

  return {
    variancePercentage,
    tolerancePercentage,
    efficiencyScore,
    rating: resolveEfficiencyRating(efficiencyScore),
  };
}
