import type { EngineeringScoreData, HealthMetrics, ScoreComponents } from "./types";
import { SCORE_WEIGHTS } from "./types";
import {
  padSparkline,
  scoreStatusLabel,
  trendFromDelta,
} from "./utils";

/**
 * Engineering Score Formula
 * =======================
 *
 * The Engineering Score is a weighted composite (0–100) of six normalized
 * health signals. Each component is clamped to 0–100 before weighting.
 *
 *   score = round(
 *     deliveryHealth  × 0.25 +
 *     productivity    × 0.25 +
 *     quality           × 0.20 +
 *     contribution      × 0.15 +
 *     utilization       × 0.10 +
 *     riskHealth        × 0.05
 *   )
 *
 * Component definitions
 * ---------------------
 * - deliveryHealth  — % of eligible active issues in delivered statuses
 * - productivity    — team average developer efficiency
 * - quality         — composite of bug-rework ratio and estimate adherence
 * - contribution    — deliveredHours / actualHours (capped at 100)
 * - utilization     — activity coverage (% of roster with logged work, beta)
 * - riskHealth      — max(0, 100 − openRiskCount × 12)
 *
 * Status bands
 * ------------
 * - ≥ 85  Excellent
 * - ≥ 70  On Track
 * - ≥ 55  Monitor
 * - < 55  Needs Attention
 *
 * Trend is computed as the delta between the current score and the prior
 * month entry in the 7-point monthly sparkline.
 */
export function scoreFromComponents(components: ScoreComponents): number {
  return Math.round(
    components.deliveryHealth * SCORE_WEIGHTS.deliveryHealth +
      components.productivity * SCORE_WEIGHTS.productivity +
      components.quality * SCORE_WEIGHTS.quality +
      components.contribution * SCORE_WEIGHTS.contribution +
      components.utilization * SCORE_WEIGHTS.utilization +
      components.riskHealth * SCORE_WEIGHTS.risk
  );
}

export function calculateEngineeringScore(
  health: HealthMetrics,
  scoreComponents: ScoreComponents
): EngineeringScoreData {
  const value = scoreFromComponents(scoreComponents);

  const monthlyScores = health.deliverySparkline.map((_, index) => {
    const components: ScoreComponents = {
      deliveryHealth:
        health.deliverySparkline[index] ?? health.deliveryHealth,
      productivity:
        health.productivitySparkline[index] ?? health.productivity,
      quality: health.qualitySparkline[index] ?? health.quality,
      contribution:
        health.contributionSparkline[index] ?? health.contribution,
      utilization:
        health.utilizationSparkline[index] ?? health.utilizationParticipation,
      riskHealth: Math.max(
        0,
        100 - (health.riskSparkline[index] ?? health.riskCount) * 12
      ),
    };
    return scoreFromComponents(components);
  });

  const sparkline = padSparkline(monthlyScores);
  const previous = sparkline.at(-2) ?? value;
  const { label: trend } = trendFromDelta(value, previous);

  return {
    value,
    trend,
    status: scoreStatusLabel(value),
    sparkline,
  };
}
