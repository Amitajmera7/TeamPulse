import { buildContributionMetrics } from "@/services/metrics/build-contribution-metrics";
import { buildDeveloperMetrics } from "@/services/metrics/build-developer-metrics";

import type { ApiContributionMetric, ApiDeveloperMetric } from "./types";
import { getLastMonths, monthKey, padSparkline } from "./utils";

export function contributionScoreForPeriod(
  metrics: ApiDeveloperMetric[],
  contribution: ApiContributionMetric[]
): number {
  const totalActual = metrics.reduce((sum, m) => sum + m.actualHours, 0);
  const totalDelivered = contribution.reduce(
    (sum, c) => sum + c.deliveredHours,
    0
  );

  if (totalActual === 0) return 0;

  return Math.min(100, Math.round((totalDelivered / totalActual) * 100));
}

export async function calculateContributionMetrics(
  issues: unknown[],
  metrics: ApiDeveloperMetric[],
  contribution: ApiContributionMetric[]
): Promise<{ contribution: number; contributionSparkline: number[] }> {
  const months = getLastMonths(7);
  const monthKeys = months.map((m) => monthKey(m));

  const byMonth = await Promise.all(
    monthKeys.map(async (key) => {
      const monthIssues = issues.filter((issue) => {
        const updated = (issue as { fields?: { updated?: string } }).fields
          ?.updated;
        return updated && monthKey(new Date(updated)) === key;
      });
      const { metrics: monthMetrics } = await buildDeveloperMetrics(monthIssues);
      const monthContribution = await buildContributionMetrics(monthIssues);
      return contributionScoreForPeriod(monthMetrics, monthContribution);
    })
  );

  return {
    contribution: contributionScoreForPeriod(metrics, contribution),
    contributionSparkline: padSparkline(byMonth),
  };
}
