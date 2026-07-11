/**
 * Dashboard Read Service — Analytics Read API application service.
 *
 * Sprint 6B Milestone 16.
 *
 * Pipeline (today):
 *   Read Service → Dashboard Repository → Analytics Snapshot → Read Model
 *
 * Future: same service can read Completed EAW batches without changing the API
 * contract or React layout.
 *
 * Does not recalculate analytics formulas.
 */

import { getDashboardData } from "@/services/dashboard-repository";
import { getSyncState } from "@/services/orchestrator";

import {
  buildDashboardReadModel,
  dashboardReadModelToDashboardData,
} from "./build-dashboard-read-model";
import type { DashboardReadModel } from "./types";

/**
 * Loads the dashboard read model from existing services.
 */
export function getDashboardReadModel(): DashboardReadModel {
  const { dashboardData, generatedAt } = getDashboardData();
  const syncState = getSyncState();

  return buildDashboardReadModel({
    dashboardData,
    generatedAt,
    syncStatus: syncState.status,
  });
}

export { dashboardReadModelToDashboardData };
