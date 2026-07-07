/**
 * Dynamic execution tolerance bands based on allocated estimate size.
 *
 * | Allocated estimate | Tolerance |
 * |--------------------|-----------|
 * | 0 – < 8 h          | ±5%       |
 * | 8 – < 40 h         | ±10%      |
 * | 40 – < 100 h       | ±12%      |
 * | 100+ h             | ±15%      |
 */

/**
 * Returns the allowed variance tolerance (%) for an allocated estimate.
 */
export function resolveTolerancePercentage(
  allocatedEstimateHours: number
): number {
  if (allocatedEstimateHours < 8) {
    return 5;
  }

  if (allocatedEstimateHours < 40) {
    return 10;
  }

  if (allocatedEstimateHours < 100) {
    return 12;
  }

  return 15;
}

/**
 * Returns true when variance sits inside the allowed tolerance band.
 */
export function isWithinTolerance(
  variancePercentage: number,
  tolerancePercentage: number
): boolean {
  return Math.abs(variancePercentage) <= tolerancePercentage;
}
