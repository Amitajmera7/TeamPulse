import type { EngineeringScoreData, HealthMetrics } from "./types";
import {
  padSparkline,
  riskHealthScore,
  scoreStatusLabel,
  trendFromDelta,
  utilizationHealthScore,
} from "./utils";

export function calculateEngineeringScore(
  health: HealthMetrics
): EngineeringScoreData {
  const utilizationScore = utilizationHealthScore(health.utilization);
  const riskScore = riskHealthScore(health.riskCount);

  const raw =
    health.deliveryHealth * 0.35 +
    health.productivity * 0.35 +
    utilizationScore * 0.2 +
    riskScore * 0.1;

  const value = Math.round(raw);

  const monthlyScores = health.deliverySparkline.map((delivery, index) => {
    const productivity = health.productivitySparkline[index] ?? health.productivity;
    const utilization = health.utilizationSparkline[index] ?? health.utilization;
    const risk = health.riskSparkline[index] ?? health.riskCount;

    return Math.round(
      delivery * 0.35 +
        productivity * 0.35 +
        utilizationHealthScore(utilization) * 0.2 +
        riskHealthScore(risk) * 0.1
    );
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
