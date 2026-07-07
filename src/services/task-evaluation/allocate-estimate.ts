import type { ResolvedEstimate } from "./types";

/**
 * Allocates engineering estimate to a developer using proportional worklog share.
 *
 * Standard engineering work:
 *   allocated = originalEstimate × (developerHours / totalSubtaskHours)
 *
 * CR / RE work:
 *   allocated = technologyEstimate × (developerTechnologyHours / totalTechnologyHours)
 *
 * Both formulas share the same shape — the caller supplies the correct
 * denominator and base estimate via {@link ResolvedEstimate}.
 */
export function allocateEstimateHours(input: {
  estimateHours: number;
  developerHours: number;
  denominatorHours: number;
}): number | null {
  const { estimateHours, developerHours, denominatorHours } = input;

  if (denominatorHours <= 0 || estimateHours <= 0) {
    return null;
  }

  return estimateHours * (developerHours / denominatorHours);
}

/**
 * Returns true when allocation should use the CR / RE technology formula.
 */
export function isTechnologyEstimate(
  estimate: ResolvedEstimate
): boolean {
  return estimate.source === "technology-estimate-field";
}
