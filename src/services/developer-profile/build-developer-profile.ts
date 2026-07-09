import { buildDeveloperEvaluation } from "./build-developer-evaluation";
import { resolveDeveloperProfileStatus } from "./status";
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
 * 2. Resolve profile status (including "No Data" for no completed work).
 *
 * Developers with no completed work are still returned — they are never
 * filtered out. Their status is "No Data".
 *
 * Engineering Score and ranking are intentionally excluded (Milestone 8B).
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
 * Useful when evaluation was already assembled and only status is needed.
 */
export function wrapDeveloperEvaluation(
  evaluation: DeveloperEvaluation
): DeveloperProfile {
  return {
    evaluation,
    status: resolveDeveloperProfileStatus(evaluation),
  };
}
