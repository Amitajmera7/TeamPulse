import { calculateEngineeringScore } from "./calculate-engineering-score";
import { buildDeveloperEvaluation } from "./build-developer-evaluation";
import { hasCompletedWork, resolveDeveloperProfileStatus } from "./status";
import type {
  BuildDeveloperEvaluationInput,
  DeveloperEvaluation,
  DeveloperProfile,
} from "./types";

/**
 * Builds the canonical {@link DeveloperProfile} for a developer.
 *
 * Pipeline:
 * 1. Assemble {@link DeveloperEvaluation} from intact engine results.
 * 2. Calculate Engineering Score (dynamic weight normalization).
 * 3. Resolve profile status from score bands (or "No Data").
 *
 * Developers with no completed work are still returned — they are never
 * filtered out. Their status is "No Data" and engineeringScore is null.
 *
 * Dense ranking is applied separately via {@link assignDenseRanks}.
 * Recovery remains visible on the evaluation and does not affect score.
 */
export function buildDeveloperProfile(
  input: BuildDeveloperEvaluationInput
): DeveloperProfile {
  const evaluation = buildDeveloperEvaluation(input);
  return wrapDeveloperEvaluation(evaluation);
}

/**
 * Wraps an existing {@link DeveloperEvaluation} into a {@link DeveloperProfile}.
 *
 * Calculates Engineering Score and status. Rank defaults to null until
 * {@link assignDenseRanks} is applied to a peer set.
 */
export function wrapDeveloperEvaluation(
  evaluation: DeveloperEvaluation
): DeveloperProfile {
  if (!hasCompletedWork(evaluation)) {
    return {
      evaluation,
      status: "No Data",
      engineeringScore: null,
      engineeringScoreDetail: null,
      rank: null,
    };
  }

  const detail = calculateEngineeringScore(evaluation);
  const engineeringScore = detail.score;

  return {
    evaluation,
    status: resolveDeveloperProfileStatus(evaluation, engineeringScore),
    engineeringScore,
    engineeringScoreDetail: engineeringScore === null ? null : detail,
    rank: null,
  };
}
