import type { DashboardRepositoryResult } from "./get-dashboard-data";
import { getDashboardDataFromRepository } from "./get-dashboard-data";

/**
 * Dashboard Repository
 *
 * Source of truth:
 *   PostgreSQL Snapshot Archive
 *
 * Memory snapshot is only a fallback.
 */
export async function getDashboardData(): Promise<DashboardRepositoryResult> {
  return getDashboardDataFromRepository();
}

export type { DashboardRepositoryResult };