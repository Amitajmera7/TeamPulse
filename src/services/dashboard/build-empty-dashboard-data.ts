/**
 * Empty DashboardData builder for missing / unusable Analytics Snapshots.
 *
 * Reuses placeholder trend builders from Dashboard Aggregator V2.
 * Never throws — always returns a valid presentation model.
 */

import { buildPlaceholderTrends } from "./build-dashboard-data";
import type { DashboardData, DashboardKpiData } from "./types";
import { getReportingPeriod } from "./utils";

function emptyKpis(generatedAt: string): DashboardKpiData[] {
  return [
    {
      id: "delivery-health",
      title: "Engineering Health",
      value: "—",
      status: "neutral",
      statusLabel: "No Data",
      trend: "neutral",
      trendLabel: "No snapshot",
      chartColor: "var(--chart-1)",
      sparkline: [],
      generatedAt,
    },
    {
      id: "productivity",
      title: "Engineering Value Delivered",
      value: "0h",
      status: "neutral",
      statusLabel: "No Data",
      trend: "neutral",
      trendLabel: "No snapshot",
      chartColor: "var(--chart-2)",
      sparkline: [],
      generatedAt,
    },
    {
      id: "utilization",
      title: "Quality",
      value: "—",
      status: "neutral",
      statusLabel: "No Data",
      trend: "neutral",
      trendLabel: "No snapshot",
      chartColor: "var(--chart-3)",
      sparkline: [],
      generatedAt,
    },
    {
      id: "risk",
      title: "Recovery",
      value: "0h",
      status: "neutral",
      statusLabel: "No Data",
      trend: "neutral",
      trendLabel: "No snapshot",
      chartColor: "var(--destructive)",
      sparkline: [],
      generatedAt,
    },
  ];
}

/**
 * Builds an empty {@link DashboardData} for UI empty-state rendering.
 *
 * Used when no completed Analytics Snapshot is available.
 */
export function buildEmptyDashboardData(
  generatedAt: string = new Date().toISOString()
): DashboardData {
  const { deliveryTrend, productivityTrend } = buildPlaceholderTrends();

  return {
    engineeringScore: {
      value: 0,
      trend: "neutral",
      status: "No Data",
      sparkline: [],
    },
    scoreComponents: {
      deliveryHealth: 0,
      productivity: 0,
      quality: 0,
      contribution: 0,
      utilization: 0,
      riskHealth: 0,
    },
    kpis: emptyKpis(generatedAt),
    deliveryTrend,
    productivityTrend,
    technologies: [],
    contributors: [],
    insights: [
      {
        id: "no-snapshot",
        title: "Waiting for analytics sync",
        description:
          "No completed Analytics Snapshot is available yet. Run a sync to populate the dashboard.",
        tone: "info",
      },
    ],
    reportingPeriod: getReportingPeriod(),
    updatedAt: generatedAt,
  };
}
