/**
 * Dashboard services — public module entry.
 *
 * Milestone 10B adds Dashboard Aggregator V2 (snapshot → DashboardData).
 * Milestone 10C: UI reads DashboardData via `@/services/dashboard-repository`.
 * Legacy `dashboard-aggregator.ts` remains for API / sync pipelines until retired.
 */

export {
  buildContributorsFromProfiles,
  compareDeveloperProfilesForContributors,
  mapDeveloperProfileToContributor,
} from "./build-contributors";
export {
  buildDashboardData,
  buildDashboardDataFromSnapshot,
  buildPlaceholderTrends,
  mapTechnologyProfileToCard,
  mapTechnologyStatusToMetricStatus,
} from "./build-dashboard-data";
export type { BuildDashboardDataInput } from "./build-dashboard-data";
export { buildEmptyDashboardData } from "./build-empty-dashboard-data";
export {
  buildExecutiveBrief,
  allTechnologiesHealthy,
  selectAttentionTechnology,
  selectBestPerformingTechnology,
  selectHighestValueTechnology,
  selectRecoveryFocusTechnology,
} from "./build-executive-brief";
export {
  buildKpisFromSnapshot,
  sumEngineeringValueDeliveredHours,
  sumRecoveryHours,
  weightedAverageEngineeringScore,
  weightedAverageQuality,
} from "./build-kpis";

export type {
  ContributorRow,
  DashboardData,
  DashboardKpiData,
  EngineeringInsight,
  EngineeringScoreData,
  ReportingPeriod,
  ScoreComponents,
  TechnologyCardData,
  TrendChartData,
} from "./types";
