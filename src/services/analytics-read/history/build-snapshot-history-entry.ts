/**
 * Builds a slim SnapshotHistoryEntry from a completed Analytics Snapshot.
 * Reads already-computed profile/dashboard values — no engine recalculation.
 */

import type { AnalyticsSnapshot } from "@/services/snapshot";
import {
  sumEngineeringValueDeliveredHours,
  sumRecoveryHours,
  weightedAverageEngineeringScore,
} from "@/services/dashboard/build-kpis";
import {
  TECHNOLOGY_NAMES,
  weightedAverage,
} from "@/services/technology-profile";

import type {
  SnapshotHistoryDeveloperSlice,
  SnapshotHistoryEntry,
  SnapshotHistoryTechnologySlice,
} from "./types";

function teamCapacityUtilization(
  snapshot: AnalyticsSnapshot
): number | null {
  return weightedAverage(
    snapshot.developerProfiles
      .filter(
        (profile) =>
          profile.engineeringScoreDetail?.components.contribution !== undefined
      )
      .map((profile) => ({
        value: profile.engineeringScoreDetail!.components.contribution as number,
        weight: profile.evaluation.contribution.deliveredEngineeringHours,
      }))
  );
}

function teamDeliveryEfficiency(
  snapshot: AnalyticsSnapshot
): number | null {
  return weightedAverage(
    snapshot.developerProfiles
      .filter((profile) => profile.evaluation.execution.resolved)
      .map((profile) => ({
        value: profile.evaluation.execution.efficiencyScore,
        weight: profile.evaluation.contribution.deliveredEngineeringHours,
      }))
  );
}

function technologySlices(
  snapshot: AnalyticsSnapshot
): SnapshotHistoryTechnologySlice[] {
  const byName = new Map(
    snapshot.technologyProfiles.map((profile) => [profile.technology, profile])
  );

  return TECHNOLOGY_NAMES.map((technology) => {
    const profile = byName.get(technology);
    return {
      technology,
      engineeringHealth: profile?.engineeringHealth ?? null,
      execution: profile?.execution ?? null,
      engineeringValueDeliveredHours:
        profile?.engineeringValueDeliveredHours ?? 0,
      recoveryHours: profile?.recoveryHours ?? 0,
    };
  });
}

function developerSlices(
  snapshot: AnalyticsSnapshot
): SnapshotHistoryDeveloperSlice[] {
  return snapshot.developerProfiles.map((profile) => ({
    developer: profile.evaluation.developer,
    technology: profile.evaluation.technology,
    engineeringScore: profile.engineeringScore,
    deliveredEngineeringHours:
      profile.evaluation.contribution.deliveredEngineeringHours,
    recoveryHours: profile.evaluation.recovery.totalRecoveryHours,
    capacityUtilization:
      profile.engineeringScoreDetail?.components.contribution ?? null,
    deliveryEfficiency: profile.evaluation.execution.resolved
      ? profile.evaluation.execution.efficiencyScore
      : null,
  }));
}

/**
 * Projects a completed snapshot into a historical archive entry.
 */
export function buildSnapshotHistoryEntry(
  snapshot: AnalyticsSnapshot
): SnapshotHistoryEntry {
  const fromDashboard = snapshot.dashboardData.engineeringScore.value;
  const engineeringScore =
    fromDashboard > 0
      ? fromDashboard
      : weightedAverageEngineeringScore(snapshot.developerProfiles);

  return {
    reportingPeriod: snapshot.reportingPeriod,
    generatedAt: snapshot.generatedAt,
    engineeringScore,
    engineeringValueDeliveredHours: sumEngineeringValueDeliveredHours(
      snapshot.developerProfiles
    ),
    recoveryHours: sumRecoveryHours(snapshot.developerProfiles),
    capacityUtilization: teamCapacityUtilization(snapshot),
    deliveryEfficiency: teamDeliveryEfficiency(snapshot),
    technologies: technologySlices(snapshot),
    developers: developerSlices(snapshot),
  };
}
