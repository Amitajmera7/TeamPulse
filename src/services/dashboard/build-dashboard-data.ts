/**
 * Dashboard Aggregator V2 — builds DashboardData from Analytics Snapshot.
 *
 * Sprint 3D Milestone 10B.
 *
 * Pipeline:
 *   Analytics Snapshot → Dashboard Aggregator → DashboardData → React
 *
 * Does not modify React components, dashboard-mock, or analytics engines.
 * Does not recalculate technology metrics — maps Technology Profiles only.
 * Does not modify existing trend builders (historical analytics out of scope).
 */

import type { AnalyticsSnapshot } from "@/services/snapshot";
import type {
  TechnologyProfile,
  TechnologyStatus,
} from "@/services/technology-profile";
import type { MetricStatus } from "@/types/dashboard";

import { buildContributorsFromProfiles } from "./build-contributors";
import { buildExecutiveBrief } from "./build-executive-brief";
import {
  buildKpisFromSnapshot,
  sumEngineeringValueDeliveredHours,
  weightedAverageEngineeringScore,
  weightedAverageQuality,
} from "./build-kpis";
import type {
  DashboardData,
  EngineeringScoreData,
  ScoreComponents,
  TechnologyCardData,
  TrendChartData,
} from "./types";
import { statusFromPercent, TECH_CHART_COLORS, TECH_NAME_TO_ID } from "./utils";

/**
 * Maps Technology Profile status to dashboard MetricStatus.
 */
export function mapTechnologyStatusToMetricStatus(
  status: TechnologyStatus
): MetricStatus {
  switch (status) {
    case "Healthy":
      return "healthy";
    case "Stable":
      return "on-track";
    case "Monitor":
      return "attention";
    case "Critical":
      return "attention";
    case "No Data":
      return "neutral";
  }
}

/**
 * Maps a Technology Profile to TechnologyCardData without recalculating metrics.
 */
export function mapTechnologyProfileToCard(
  profile: TechnologyProfile
): TechnologyCardData {
  const id = TECH_NAME_TO_ID[profile.technology] ?? profile.technology.toLowerCase();
  const healthScore = profile.engineeringHealth ?? 0;

  return {
    id,
    name: profile.technology,
    status: mapTechnologyStatusToMetricStatus(profile.status),
    statusLabel: profile.status,
    developers: profile.developerCount,
    hours: Math.round(profile.engineeringValueDeliveredHours),
    stories: 0,
    efficiency: Math.round(profile.execution ?? 0),
    sparkline:
      profile.engineeringHealth === null ? [] : [profile.engineeringHealth],
    chartColor: TECH_CHART_COLORS[id] ?? "var(--chart-2)",
    healthScore: Math.round(healthScore),
  };
}

/**
 * Placeholder trends for Milestone 10B.
 * Existing trend builders are unchanged; historical analytics are out of scope.
 */
export function buildPlaceholderTrends(): {
  deliveryTrend: TrendChartData;
  productivityTrend: TrendChartData;
} {
  return {
    deliveryTrend: {
      title: "Delivery Trend",
      description: "Historical delivery analytics are outside this milestone",
      dropdown: "Stories",
      data: [],
    },
    productivityTrend: {
      title: "Productivity Trend",
      description:
        "Historical productivity analytics are outside this milestone",
      dropdown: "Productivity",
      data: [],
    },
  };
}

function buildEngineeringScoreData(
  averageScore: number | null
): EngineeringScoreData {
  if (averageScore === null) {
    return {
      value: 0,
      trend: "neutral",
      status: "No Data",
      sparkline: [],
    };
  }

  const { label } = statusFromPercent(averageScore);

  return {
    value: Math.round(averageScore),
    trend: "neutral",
    status: label,
    sparkline: [averageScore],
  };
}

function buildScoreComponentsFromSnapshot(
  developerProfiles: AnalyticsSnapshot["developerProfiles"]
): ScoreComponents {
  const health = weightedAverageEngineeringScore(developerProfiles);
  const quality = weightedAverageQuality(developerProfiles);
  const valueHours = sumEngineeringValueDeliveredHours(developerProfiles);

  return {
    deliveryHealth: health ?? 0,
    productivity: health ?? 0,
    quality: quality ?? 0,
    contribution: Math.min(valueHours, 100),
    utilization: 0,
    riskHealth: 100,
  };
}

/**
 * Builds {@link DashboardData} from an {@link AnalyticsSnapshot}.
 *
 * Uses developer and technology profiles from the snapshot.
 * Does not read or mutate `snapshot.dashboardData` (avoids circular projection).
 *
 * Trends are placeholders — existing trend builders are not modified.
 */
export function buildDashboardDataFromSnapshot(
  snapshot: AnalyticsSnapshot
): DashboardData {
  const { developerProfiles, technologyProfiles, reportingPeriod, generatedAt } =
    snapshot;

  const kpis = buildKpisFromSnapshot({
    developerProfiles,
    generatedAt,
  });

  const contributors = buildContributorsFromProfiles(developerProfiles);
  const technologies = technologyProfiles.map(mapTechnologyProfileToCard);
  const insights = buildExecutiveBrief(technologyProfiles);
  const { deliveryTrend, productivityTrend } = buildPlaceholderTrends();

  const averageScore = weightedAverageEngineeringScore(developerProfiles);

  return {
    engineeringScore: buildEngineeringScoreData(averageScore),
    scoreComponents: buildScoreComponentsFromSnapshot(developerProfiles),
    kpis,
    deliveryTrend,
    productivityTrend,
    technologies,
    contributors,
    insights,
    reportingPeriod: { ...reportingPeriod },
    updatedAt: generatedAt,
  };
}
