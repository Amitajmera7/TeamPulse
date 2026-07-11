/**
 * Analytics Read API — public module entry.
 *
 * Sprint 6B Milestone 16: read layer between Dashboard UI and analytics sources.
 * Sprint 7C Milestone 19: Historical Engineering Analytics read projection.
 * Sprint 7D Milestone 20: Engineering Explorer read projection.
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

export {
  getExplorerReadModel,
  getExplorerDeveloperDetail,
  getExplorerTechnologyDetail,
  getExplorerProjectDetail,
} from "./explorer";
export type {
  ExplorerReadModel,
  ExplorerDeveloperDetail,
  ExplorerTechnologyDetail,
  ExplorerProjectDetail,
  ExplorerSearchIndexEntry,
} from "./explorer";
