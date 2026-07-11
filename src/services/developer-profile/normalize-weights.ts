import type {
  EngineeringScoreKpi,
  EngineeringScoreWeights,
} from "./config";
import { ENGINEERING_SCORE_CONFIG } from "./config";
import type { NormalizedWeights } from "./types";

export type { NormalizedWeights };

/**
 * Dynamically normalizes raw KPI weights across only the available KPIs.
 *
 * Formula (for each available KPI k):
 *   normalized(k) = rawWeight(k) / sum(rawWeight of available KPIs)
 *
 * Missing KPIs are omitted — their weight is redistributed, never treated
 * as zero contribution to the denominator.
 *
 * Returns an empty object when no KPIs are available.
 */
export function normalizeWeights(
  availableKpis: readonly EngineeringScoreKpi[],
  weights: EngineeringScoreWeights = ENGINEERING_SCORE_CONFIG.weights
): NormalizedWeights {
  if (availableKpis.length === 0) {
    return {};
  }

  const unique = [...new Set(availableKpis)];
  const total = unique.reduce((sum, kpi) => sum + weights[kpi], 0);

  if (total <= 0) {
    return {};
  }

  const normalized: NormalizedWeights = {};

  for (const kpi of unique) {
    normalized[kpi] = weights[kpi] / total;
  }

  return normalized;
}
