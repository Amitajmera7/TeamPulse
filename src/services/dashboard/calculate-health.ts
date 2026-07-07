import { buildDeveloperMetrics } from "@/services/metrics/build-developer-metrics";

import type { ApiDeveloperMetric, HealthMetrics } from "./types";
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
    const typed = issue as {
      fields?: { status?: { name?: string } };
    };
    const status = typed.fields?.status?.name;
    return (
      issueHasEligibleWorklog(typed) && !isDeliveredStatus(status)
    );
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

function utilizationFromMetrics(metrics: ApiDeveloperMetric[]): number {
  const totalActual = metrics.reduce((sum, m) => sum + m.actualHours, 0);
  const totalEstimated = metrics.reduce((sum, m) => sum + m.estimatedHours, 0);
  if (totalEstimated === 0) return 0;

  return Math.min(
    100,
    Math.round((totalActual / totalEstimated) * 100)
  );
}

async function productivityForIssues(issues: unknown[]): Promise<number> {
  const { metrics } = await buildDeveloperMetrics(issues);
  return productivityFromMetrics(metrics);
}

export async function calculateHealthMetrics(
  issues: unknown[],
  metrics: ApiDeveloperMetric[]
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
    utilizationByMonth.push(utilizationFromMetrics(monthMetrics));
    riskByMonth.push(countDeliveryRisk(monthIssues));
  }

  const deliveryHealth = deliveryHealthForIssues(issues);
  const productivity = productivityFromMetrics(metrics);
  const utilization = utilizationFromMetrics(metrics);
  const riskCount = countDeliveryRisk(issues);

  return {
    deliveryHealth,
    productivity,
    utilization,
    riskCount,
    deliverySparkline: padSparkline(deliveryByMonth),
    productivitySparkline: padSparkline(productivityByMonth),
    utilizationSparkline: padSparkline(utilizationByMonth),
    riskSparkline: padSparkline(riskByMonth),
  };
}

export function buildKpisFromHealth(health: HealthMetrics) {
  const deliveryStatus = statusFromPercent(health.deliveryHealth);
  const productivityStatus = statusFromPercent(health.productivity);
  const utilizationStatus = statusFromPercent(health.utilization);
  const riskStatus = statusFromRisk(health.riskCount);

  const deliveryTrend = trendFromDelta(
    health.deliveryHealth,
    health.deliverySparkline.at(-2) ?? health.deliveryHealth
  );
  const productivityTrend = trendFromDelta(
    health.productivity,
    health.productivitySparkline.at(-2) ?? health.productivity
  );
  const utilizationTrend = trendFromDelta(
    health.utilization,
    health.utilizationSparkline.at(-2) ?? health.utilization
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
      value: `${health.utilization}%`,
      status: utilizationStatus.status,
      statusLabel: utilizationStatus.label,
      trend: utilizationTrend.trend,
      trendLabel: utilizationTrend.label,
      chartColor: "var(--chart-3)",
      sparkline: health.utilizationSparkline,
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
