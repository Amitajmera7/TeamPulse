import type { RecoveryRating } from "./types";

/** Recovery percentage thresholds for Low / Medium / High ratings. */
export const RECOVERY_RATING_THRESHOLDS = {
  LOW_MAX: 10,
  MEDIUM_MAX: 30,
} as const;

/**
 * Calculates recovery percentage for a developer.
 *
 * Formula:
 *   (developerRecoveryHours / totalRecoveryHours) × 100
 *
 * Returns 0 when totalRecoveryHours is zero.
 */
export function calculateRecoveryPercentage(
  developerRecoveryHours: number,
  totalRecoveryHours: number
): number {
  if (totalRecoveryHours <= 0) {
    return 0;
  }

  return (developerRecoveryHours / totalRecoveryHours) * 100;
}

/**
 * Maps recovery percentage to an informational rating band.
 *
 * | Percentage | Rating |
 * |------------|--------|
 * | < 10%      | Low    |
 * | 10% – 30%  | Medium |
 * | > 30%      | High   |
 */
export function resolveRecoveryRating(
  recoveryPercentage: number
): RecoveryRating {
  if (recoveryPercentage < RECOVERY_RATING_THRESHOLDS.LOW_MAX) {
    return "Low";
  }

  if (recoveryPercentage <= RECOVERY_RATING_THRESHOLDS.MEDIUM_MAX) {
    return "Medium";
  }

  return "High";
}
