import { buildContributionMetrics } from "@/services/metrics/build-contribution-metrics";
import { buildDeveloperMetrics } from "@/services/metrics/build-developer-metrics";

import { calculateBrief } from "./calculate-brief";
import {
  buildKpisFromHealth,
  calculateHealthMetrics,
} from "./calculate-health";
import { calculateLeaderboard } from "./calculate-leaderboard";
import { calculateEngineeringScore } from "./calculate-score";
import { calculateTechnologyCards } from "./calculate-technology";
import { calculateTrends } from "./calculate-trends";
import { fetchDashboardIssues } from "./fetch-dashboard-issues";
import type { DashboardData } from "./types";

export async function aggregateDashboardData(): Promise<DashboardData> {
  const issues = await fetchDashboardIssues();

  const { metrics } = await buildDeveloperMetrics(issues);
  const contribution = await buildContributionMetrics(issues);

  const health = await calculateHealthMetrics(issues, metrics);
  const engineeringScore = calculateEngineeringScore(health);
  const kpis = buildKpisFromHealth(health);
  const technologies = calculateTechnologyCards(metrics, contribution, issues);
  const contributors = calculateLeaderboard(metrics, contribution);
  const briefItems = calculateBrief(health, technologies, contributors);
  const { deliveryTrend, productivityTrend } = await calculateTrends(issues);

  return {
    engineeringScore,
    kpis,
    deliveryTrend,
    productivityTrend,
    technologies,
    contributors,
    briefItems,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Fetches dashboard data using the same underlying services as
 * GET /api/metrics and GET /api/contribution.
 */
export async function getDashboardData(): Promise<DashboardData> {
  return aggregateDashboardData();
}
