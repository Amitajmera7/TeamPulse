/**
 * Dashboard Repository — public module entry.
 *
 * Sprint 3D Milestone 10C makes the repository the sole UI data entry point.
 *
 * The Dashboard Repository currently uses Analytics Snapshot.
 * Mock data remains available for development, testing and demos.
 *
 * React consumes DashboardData only and must not import dashboard-mock.
 */

export {
  getDashboardDataFromRepository,
  isUsableAnalyticsSnapshot,
} from "./get-dashboard-data";
export { getDashboardData } from "./repository";

export type { DashboardRepositoryResult } from "./get-dashboard-data";
