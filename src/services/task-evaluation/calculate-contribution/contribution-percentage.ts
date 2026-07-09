/**
 * Calculates contribution percentage for a developer.
 *
 * Formula:
 *   (developerDeliveredHours / totalDeliveredHours) × 100
 *
 * Returns 0 when totalDeliveredHours is zero.
 */
export function calculateContributionPercentage(
  developerDeliveredHours: number,
  totalDeliveredHours: number
): number {
  if (totalDeliveredHours <= 0) {
    return 0;
  }

  return (developerDeliveredHours / totalDeliveredHours) * 100;
}
