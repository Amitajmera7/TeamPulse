/**
 * Analytics Read API — public module entry.
 *
 * Sprint 6B Milestone 16: read layer between Dashboard UI and analytics sources.
 * Sprint 7C Milestone 19: Historical Engineering Analytics read projection.
 */

export type { DashboardReadModel } from "./types";
export {
  buildDashboardReadModel,
  dashboardReadModelToDashboardData,
} from "./build-dashboard-read-model";
export type { BuildDashboardReadModelInput } from "./build-dashboard-read-model";
export { getDashboardReadModel } from "./dashboard-read-service";

export {
  getAnalyticsHistoryReadModel,
  parseAnalyticsHistoryFilters,
  buildSnapshotHistoryEntry,
  pushSnapshotHistoryEntry,
  getSnapshotHistoryEntries,
  getSnapshotHistoryCount,
} from "./history";
export type {
  AnalyticsHistoryFilters,
  AnalyticsHistoryMonths,
  AnalyticsHistoryReadModel,
  HistorySeriesCompleteness,
  SnapshotHistoryEntry,
} from "./history";
