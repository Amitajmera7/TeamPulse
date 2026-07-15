/**
 * Dashboard Read Service — Analytics Read API application service.
 *
 * Sprint 6B Milestone 16.
 *
 * Pipeline:
 *   Read Service → Dashboard Repository → Analytics Snapshot → Read Model
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
export async function getDashboardReadModel(): Promise<DashboardReadModel> {
  const { dashboardData, generatedAt } = await getDashboardData();

  const syncState = getSyncState();

  return buildDashboardReadModel({
    dashboardData,
    generatedAt,
    syncStatus: syncState.status,
  });
}

export { dashboardReadModelToDashboardData };