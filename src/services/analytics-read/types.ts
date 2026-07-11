/**
 * Analytics Read API — read-model types for the dashboard.
 *
 * Sprint 6B Milestone 16.
 * Assembled from existing analytics outputs — no formula recalculation.
 */

import type {
  ContributorRow,
  DashboardKpiData,
  EngineeringInsight,
  EngineeringScoreData,
  ReportingPeriod,
  ScoreComponents,
  TechnologyCardData,
  TrendChartData,
} from "@/services/dashboard/types";
import type { SyncStatus } from "@/services/snapshot";

/**
 * Single read model consumed by GET /api/dashboard and the Dashboard page.
 *
 * Built from existing Dashboard Repository / snapshot outputs.
 * Does not recalculate Engineering Score or other analytics formulas.
 */
export interface DashboardReadModel {
  readonly engineeringScore: EngineeringScoreData;
  /** Required for UI parity with existing ExecutiveDashboard (DashboardData). */
  readonly scoreComponents: ScoreComponents;
  readonly kpis: readonly DashboardKpiData[];
  readonly technologies: readonly TechnologyCardData[];
  readonly contributors: readonly ContributorRow[];
  /** Executive brief insights (maps from DashboardData.insights). */
  readonly executiveBrief: readonly EngineeringInsight[];
  /**
   * Reserved for AI insight cards. Currently empty — AiInsightsCard is
   * presentational and does not consume this array yet.
   */
  readonly aiInsights: readonly EngineeringInsight[];
  /** Required for existing trend charts (no UI redesign). */
  readonly deliveryTrend: TrendChartData;
  readonly productivityTrend: TrendChartData;
  readonly reportingPeriod: ReportingPeriod;
  /** Snapshot / projection generation timestamp. */
  readonly generatedAt: string | null;
  /** Live orchestrator sync status (process-local today). */
  readonly syncStatus: SyncStatus;
}
