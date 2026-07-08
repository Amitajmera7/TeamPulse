import type { QualityRating } from "./types";

const MIN_QUALITY_SCORE = 20;
const MAX_QUALITY_SCORE = 100;
const BASE_QUALITY_SCORE = 100;

/**
 * Calculates delivery quality score from proportional penalties.
 *
 * Formula:
 *   qualityScore = clamp(100 - proportionalPenalty, 20, 100)
 */
export function calculateQualityScore(proportionalPenalty: number): number {
  const rawScore = BASE_QUALITY_SCORE - proportionalPenalty;

  return Math.max(
    MIN_QUALITY_SCORE,
    Math.min(MAX_QUALITY_SCORE, rawScore)
  );
}

/**
 * Maps a delivery quality score to a rating band.
 */
export function resolveQualityRating(
  qualityScore: number
): QualityRating {
  if (qualityScore >= 90) {
    return "Excellent";
  }

  if (qualityScore >= 75) {
    return "Very Good";
  }

  if (qualityScore >= 60) {
    return "On Track";
  }

  if (qualityScore >= 40) {
    return "Needs Improvement";
  }

  return "Critical";
}

export { BASE_QUALITY_SCORE, MAX_QUALITY_SCORE, MIN_QUALITY_SCORE };
