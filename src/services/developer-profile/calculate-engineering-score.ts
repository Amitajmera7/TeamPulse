import {
  ENGINEERING_SCORE_CONFIG,
  type EngineeringScoreKpi,
} from "./config";
import { normalizeWeights } from "./normalize-weights";
import type {
  DeveloperEvaluation,
  EngineeringScoreComponents,
  EngineeringScoreResult,
} from "./types";

export type { EngineeringScoreComponents, EngineeringScoreResult };

/**
 * Contribution Score from delivered engineering hours.
 *
 *   min(DeliveredEngineeringHours / ExpectedEngineeringCapacityHours × 100, 100)
 *
 * Does not use contributionPercentage from the Contribution engine.
 */
export function calculateContributionScore(
  deliveredEngineeringHours: number,
  expectedEngineeringCapacityHours: number = ENGINEERING_SCORE_CONFIG.expectedEngineeringCapacityHours
): number {
  if (expectedEngineeringCapacityHours <= 0) {
    return 0;
  }

  return Math.min(
    (deliveredEngineeringHours / expectedEngineeringCapacityHours) * 100,
    100
  );
}

/**
 * Resolves which implemented KPIs are available for scoring.
 *
 * - Execution: available when `execution.resolved`
 * - Quality: available when `quality.resolved`
 * - Contribution: available when the contribution result is resolved
 *   (zero delivered hours is a valid score of 0, not a missing KPI)
 *
 * Recovery is never included.
 */
export function resolveAvailableKpis(
  evaluation: DeveloperEvaluation
): EngineeringScoreKpi[] {
  const available: EngineeringScoreKpi[] = [];

  if (evaluation.execution.resolved) {
    available.push("execution");
  }

  if (evaluation.quality.resolved) {
    available.push("quality");
  }

  if (evaluation.contribution.resolved) {
    available.push("contribution");
  }

  return available;
}

/**
 * Calculates Engineering Score from a {@link DeveloperEvaluation}.
 *
 * Pipeline:
 * 1. Resolve available implemented KPIs (ignore missing; never treat as 0).
 * 2. Dynamically normalize configured weights across available KPIs only.
 * 3. Contribution Score = min(deliveredHours / expectedHours × 100, 100).
 * 4. Engineering Score = Σ (componentScore × normalizedWeight).
 * 5. Store full precision — UI rounding is deferred.
 *
 * Recovery does not affect Engineering Score.
 */
export function calculateEngineeringScore(
  evaluation: DeveloperEvaluation
): EngineeringScoreResult {
  const availableKpis = resolveAvailableKpis(evaluation);

  if (availableKpis.length === 0) {
    return {
      score: null,
      components: {},
      normalizedWeights: {},
    };
  }

  const components: EngineeringScoreComponents = {};

  if (availableKpis.includes("execution")) {
    components.execution = evaluation.execution.efficiencyScore;
  }

  if (availableKpis.includes("quality")) {
    components.quality = evaluation.quality.qualityScore;
  }

  if (availableKpis.includes("contribution")) {
    components.contribution = calculateContributionScore(
      evaluation.contribution.deliveredEngineeringHours,
      ENGINEERING_SCORE_CONFIG.expectedEngineeringCapacityHours
    );
  }

  const normalized = normalizeWeights(
    availableKpis,
    ENGINEERING_SCORE_CONFIG.weights
  );

  let score = 0;

  for (const kpi of availableKpis) {
    const component = components[kpi];
    const weight = normalized[kpi];

    if (component === undefined || weight === undefined) {
      continue;
    }

    score += component * weight;
  }

  return {
    score,
    components,
    normalizedWeights: normalized,
  };
}
