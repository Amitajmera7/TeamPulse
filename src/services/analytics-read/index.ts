/**
 * Analytics Read API — public module entry.
 *
 * Sprint 6B Milestone 16: read layer between Dashboard UI and analytics sources.
 */

export type { DashboardReadModel } from "./types";
export {
  buildDashboardReadModel,
  dashboardReadModelToDashboardData,
} from "./build-dashboard-read-model";
export type { BuildDashboardReadModelInput } from "./build-dashboard-read-model";
export { getDashboardReadModel } from "./dashboard-read-service";
