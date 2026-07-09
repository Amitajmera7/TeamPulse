import type {
  BuildDeveloperEvaluationInput,
  DeveloperEvaluation,
} from "./types";

/**
 * Assembles a {@link DeveloperEvaluation} from intact engine results.
 *
 * Pure aggregation — does not invoke metric engines, recalculate scores,
 * or flatten result objects. Callers supply pre-computed engine outputs.
 *
 * Recovery is included for visibility and must never be omitted.
 */
export function buildDeveloperEvaluation(
  input: BuildDeveloperEvaluationInput
): DeveloperEvaluation {
  return {
    developer: input.developer,
    technology: input.technology,
    reportingPeriod: input.reportingPeriod,
    execution: input.execution,
    quality: input.quality,
    recovery: input.recovery,
    contribution: input.contribution,
  };
}
