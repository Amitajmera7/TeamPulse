/**
 * Dashboard Repository facade.
 *
 * Abstracts the data source for DashboardData. Current provider: Analytics Snapshot.
 * Future providers (database, cache) can replace the internals without changing React.
 */

import {
  getDashboardDataFromRepository,
  isUsableAnalyticsSnapshot,
  type DashboardRepositoryResult,
} from "./get-dashboard-data";

/**
 * Dashboard Repository — sole UI entry for DashboardData.
 *
 * @returns Presentation data plus optional snapshot `generatedAt` for Last Sync.
 */
export function getDashboardData(): DashboardRepositoryResult {
  return getDashboardDataFromRepository();
}

export type { DashboardRepositoryResult };
export { isUsableAnalyticsSnapshot };
