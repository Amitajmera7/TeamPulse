import { buildContributionMetrics } from "@/services/metrics/build-contribution-metrics";
import { buildDeveloperMetrics } from "@/services/metrics/build-developer-metrics";

import { calculateInsights } from "./calculate-insights";
import {
  buildKpisFromHealth,
  buildScoreComponents,
  calculateHealthMetrics,
} from "./calculate-health";
import { calculateLeaderboard } from "./calculate-leaderboard";
import { calculateEngineeringScore } from "./calculate-score";
import { calculateTechnologyCards } from "./calculate-technology";
import { calculateTrends } from "./calculate-trends";
import { fetchDashboardIssues } from "./fetch-dashboard-issues";
import type { DashboardData } from "./types";
import { getReportingPeriod } from "./utils";

export async function aggregateDashboardData(): Promise<DashboardData> {
  const issues = await fetchDashboardIssues();

  const { metrics } = await buildDeveloperMetrics(issues);
  const contribution = await buildContributionMetrics(issues);

  const health = await calculateHealthMetrics(issues, metrics, contribution);
  const scoreComponents = buildScoreComponents(health);
  const engineeringScore = calculateEngineeringScore(health, scoreComponents);
  const kpis = buildKpisFromHealth(health);
  const technologies = calculateTechnologyCards(metrics, contribution, issues);
  const contributors = calculateLeaderboard(metrics, contribution);
  const insights = calculateInsights(
    health,
    scoreComponents,
    technologies,
    contributors
  );
  const { deliveryTrend, productivityTrend } = await calculateTrends(issues);

  return {
    engineeringScore,
    scoreComponents,
    kpis,
    deliveryTrend,
    productivityTrend,
    technologies,
    contributors,
    insights,
    reportingPeriod: getReportingPeriod(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Returns the central DashboardData object using the same underlying
 * services as GET /api/metrics and GET /api/contribution.
 */
export async function getDashboardData(): Promise<DashboardData> {
  return aggregateDashboardData();
}
