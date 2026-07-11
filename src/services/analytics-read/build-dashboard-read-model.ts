/**
 * Builds DashboardReadModel from existing repository / sync outputs.
 *
 * No analytics formula recalculation — pure projection mapping.
 */

import type { DashboardData } from "@/services/dashboard/types";
import type { SyncStatus } from "@/services/snapshot";

import type { DashboardReadModel } from "./types";

export interface BuildDashboardReadModelInput {
  readonly dashboardData: DashboardData;
  readonly generatedAt: string | null;
  readonly syncStatus: SyncStatus;
}

/**
 * Maps existing DashboardData (+ sync metadata) into the Analytics Read model.
 */
export function buildDashboardReadModel(
  input: BuildDashboardReadModelInput
): DashboardReadModel {
  const { dashboardData, generatedAt, syncStatus } = input;

  return {
    engineeringScore: dashboardData.engineeringScore,
    scoreComponents: dashboardData.scoreComponents,
    kpis: dashboardData.kpis,
    technologies: dashboardData.technologies,
    contributors: dashboardData.contributors,
    executiveBrief: dashboardData.insights,
    aiInsights: [],
    deliveryTrend: dashboardData.deliveryTrend,
    productivityTrend: dashboardData.productivityTrend,
    reportingPeriod: dashboardData.reportingPeriod,
    generatedAt,
    syncStatus,
  };
}

/**
 * Converts a read model back to DashboardData for existing React components.
 * Visual output stays identical — no layout changes.
 */
export function dashboardReadModelToDashboardData(
  model: DashboardReadModel
): DashboardData {
  return {
    engineeringScore: model.engineeringScore,
    scoreComponents: model.scoreComponents,
    kpis: [...model.kpis],
    deliveryTrend: model.deliveryTrend,
    productivityTrend: model.productivityTrend,
    technologies: [...model.technologies],
    contributors: [...model.contributors],
    insights: [...model.executiveBrief],
    reportingPeriod: { ...model.reportingPeriod },
    updatedAt: model.generatedAt ?? model.reportingPeriod.to,
  };
}
