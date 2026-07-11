/**
 * Dashboard services — public module entry.
 *
 * Milestone 10B adds Dashboard Aggregator V2 (snapshot → DashboardData).
 * Legacy `getDashboardData` remains available via dashboard-aggregator.ts
 * for the current React page until snapshot wiring replaces it.
 */

export {
  buildContributorsFromProfiles,
  compareDeveloperProfilesForContributors,
  mapDeveloperProfileToContributor,
} from "./build-contributors";
export {
  buildDashboardDataFromSnapshot,
  buildPlaceholderTrends,
  mapTechnologyProfileToCard,
  mapTechnologyStatusToMetricStatus,
} from "./build-dashboard-data";
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
