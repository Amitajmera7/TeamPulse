import { ELIGIBLE_DEVELOPERS } from "@/config/eligible-developers";
import { buildDeveloperMetrics } from "@/services/metrics/build-developer-metrics";

import { calculateContributionMetrics } from "./calculate-contribution-score";
import { calculateQualityMetrics } from "./calculate-quality";
import type { ApiContributionMetric, ApiDeveloperMetric, HealthMetrics, ScoreComponents } from "./types";
import {
  getLastMonths,
  isDeliveredStatus,
  issueHasEligibleWorklog,
  monthKey,
  padSparkline,
  riskTrendLabel,
  statusFromPercent,
  statusFromRisk,
  trendFromDelta,
} from "./utils";

function getIssueMonth(issue: unknown): string | null {
  const typed = issue as { fields?: { updated?: string } };
  const updated = typed.fields?.updated;
  if (!updated) return null;
  return monthKey(new Date(updated));
}

function countDeliveryRisk(issues: unknown[]): number {
  return issues.filter((issue) => {
    const typed = issue as { fields?: { status?: { name?: string } } };
    const status = typed.fields?.status?.name;
    return issueHasEligibleWorklog(typed) && !isDeliveredStatus(status);
  }).length;
}

function deliveryHealthForIssues(issues: unknown[]): number {
  const eligible = issues.filter((issue) => issueHasEligibleWorklog(issue));
  if (eligible.length === 0) return 0;

  const delivered = eligible.filter((issue) => {
    const typed = issue as { fields?: { status?: { name?: string } } };
    return isDeliveredStatus(typed.fields?.status?.name);
  }).length;

  return Math.round((delivered / eligible.length) * 100);
}

function productivityFromMetrics(metrics: ApiDeveloperMetric[]): number {
  const active = metrics.filter((m) => m.actualHours > 0);
  if (active.length === 0) return 0;

  const total = active.reduce((sum, m) => sum + m.efficiency, 0);
  return Math.round(total / active.length);
}

/** Activity coverage — beta proxy until capacity-based utilization exists. */
function participationFromMetrics(metrics: ApiDeveloperMetric[]): number {
  const activeCount = metrics.filter((m) => m.actualHours > 0).length;
  if (ELIGIBLE_DEVELOPERS.length === 0) return 0;

  return Math.round((activeCount / ELIGIBLE_DEVELOPERS.length) * 100);
}

async function productivityForIssues(issues: unknown[]): Promise<number> {
  const { metrics } = await buildDeveloperMetrics(issues);
  return productivityFromMetrics(metrics);
}

export async function calculateHealthMetrics(
  issues: unknown[],
  metrics: ApiDeveloperMetric[],
  contribution: ApiContributionMetric[]
): Promise<HealthMetrics> {
  const months = getLastMonths(7);
  const monthKeys = months.map((m) => monthKey(m));

  const deliveryByMonth: number[] = [];
  const productivityByMonth: number[] = [];
  const utilizationByMonth: number[] = [];
  const riskByMonth: number[] = [];

  for (const key of monthKeys) {
    const monthIssues = issues.filter(
      (issue) => getIssueMonth(issue) === key
    );

    deliveryByMonth.push(deliveryHealthForIssues(monthIssues));
    productivityByMonth.push(await productivityForIssues(monthIssues));

    const { metrics: monthMetrics } = await buildDeveloperMetrics(monthIssues);
    utilizationByMonth.push(participationFromMetrics(monthMetrics));
    riskByMonth.push(countDeliveryRisk(monthIssues));
  }

  const { quality, qualitySparkline } = await calculateQualityMetrics(
    issues,
    metrics
  );
  const { contribution: contributionScore, contributionSparkline } =
    await calculateContributionMetrics(issues, metrics, contribution);

  return {
    deliveryHealth: deliveryHealthForIssues(issues),
    productivity: productivityFromMetrics(metrics),
    quality,
    contribution: contributionScore,
    utilizationParticipation: participationFromMetrics(metrics),
    riskCount: countDeliveryRisk(issues),
    deliverySparkline: padSparkline(deliveryByMonth),
    productivitySparkline: padSparkline(productivityByMonth),
    qualitySparkline,
    contributionSparkline,
    utilizationSparkline: padSparkline(utilizationByMonth),
    riskSparkline: padSparkline(riskByMonth),
  };
}

export function buildKpisFromHealth(health: HealthMetrics) {
  const deliveryStatus = statusFromPercent(health.deliveryHealth);
  const productivityStatus = statusFromPercent(health.productivity);
  const riskStatus = statusFromRisk(health.riskCount);

  const deliveryTrend = trendFromDelta(
    health.deliveryHealth,
    health.deliverySparkline.at(-2) ?? health.deliveryHealth
  );
  const productivityTrend = trendFromDelta(
    health.productivity,
    health.productivitySparkline.at(-2) ?? health.productivity
  );
  const participationTrend = trendFromDelta(
    health.utilizationParticipation,
    health.utilizationSparkline.at(-2) ?? health.utilizationParticipation
  );
  const riskTrend = riskTrendLabel(health.riskCount);

  return [
    {
      id: "delivery-health" as const,
      title: "Delivery Health",
      value: `${health.deliveryHealth}%`,
      status: deliveryStatus.status,
      statusLabel: deliveryStatus.label,
      trend: deliveryTrend.trend,
      trendLabel: deliveryTrend.label,
      chartColor: "var(--chart-1)",
      sparkline: health.deliverySparkline,
    },
    {
      id: "productivity" as const,
      title: "Engineering Productivity",
      value: `${health.productivity}%`,
      status: productivityStatus.status,
      statusLabel: productivityStatus.label,
      trend: productivityTrend.trend,
      trendLabel: productivityTrend.label,
      chartColor: "var(--chart-2)",
      sparkline: health.productivitySparkline,
    },
    {
      id: "utilization" as const,
      title: "Resource Utilization",
      value: `${health.utilizationParticipation}%`,
      status: "neutral" as const,
      statusLabel: "Beta",
      trend: participationTrend.trend,
      trendLabel: "Activity coverage · Beta",
      chartColor: "var(--chart-3)",
      sparkline: health.utilizationSparkline,
      badge: "Beta",
    },
    {
      id: "risk" as const,
      title: "Delivery Risk",
      value: String(health.riskCount),
      status: riskStatus.status,
      statusLabel: riskStatus.label,
      trend: riskTrend.trend,
      trendLabel: riskTrend.label,
      chartColor: "var(--destructive)",
      sparkline: health.riskSparkline,
      valueClassName: "text-destructive",
    },
  ];
}

export function buildScoreComponents(health: HealthMetrics): ScoreComponents {
  return {
    deliveryHealth: health.deliveryHealth,
    productivity: health.productivity,
    quality: health.quality,
    contribution: health.contribution,
    utilization: health.utilizationParticipation,
    riskHealth: Math.max(0, 100 - health.riskCount * 12),
  };
}
