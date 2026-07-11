/**
 * Maps snapshot profiles → Explorer list items (no formula engines).
 */

import type { DeveloperProfile } from "@/services/developer-profile";
import type { TechnologyProfile } from "@/services/technology-profile";
import { getInitials, TECH_NAME_TO_ID } from "@/services/dashboard/utils";
import {
  getSnapshotHistoryEntries,
} from "@/services/analytics-read/history";

import type {
  ExplorerDeveloperListItem,
  ExplorerTechnologyListItem,
} from "./types";

export function technologyIdFromName(name: string): string {
  return TECH_NAME_TO_ID[name] ?? name.toLowerCase().replace(/\s+/g, "-");
}

export function technologyNameFromId(id: string): string | null {
  const entries = Object.entries(TECH_NAME_TO_ID);
  const found = entries.find(([, value]) => value === id);
  if (found) {
    return found[0];
  }
  return null;
}

function developerTrend(name: string): number[] {
  return getSnapshotHistoryEntries()
    .map((entry) => {
      const slice = entry.developers.find((d) => d.developer === name);
      return slice?.engineeringScore ?? null;
    })
    .filter((value): value is number => value !== null)
    .reverse();
}

function technologyTrend(name: string): number[] {
  return getSnapshotHistoryEntries()
    .map((entry) => {
      const slice = entry.technologies.find((t) => t.technology === name);
      return slice?.engineeringHealth ?? null;
    })
    .filter((value): value is number => value !== null)
    .reverse();
}

export function mapDeveloperToExplorerItem(
  profile: DeveloperProfile
): ExplorerDeveloperListItem {
  const name = profile.evaluation.developer;
  return {
    id: name,
    name,
    initials: getInitials(name),
    technology: profile.evaluation.technology,
    status: profile.status,
    engineeringScore: profile.engineeringScore,
    deliveredHours: profile.evaluation.contribution.deliveredEngineeringHours,
    recoveryHours: profile.evaluation.recovery.totalRecoveryHours,
    capacityUtilization:
      profile.engineeringScoreDetail?.components.contribution ?? null,
    deliveryEfficiency: profile.evaluation.execution.resolved
      ? profile.evaluation.execution.efficiencyScore
      : null,
    trend: developerTrend(name),
  };
}

export function mapTechnologyToExplorerItem(
  profile: TechnologyProfile,
  developers: readonly DeveloperProfile[]
): ExplorerTechnologyListItem {
  const topContributors = [...developers]
    .filter((d) => d.evaluation.technology === profile.technology)
    .sort((a, b) => {
      const aHours = a.evaluation.contribution.deliveredEngineeringHours;
      const bHours = b.evaluation.contribution.deliveredEngineeringHours;
      return bHours - aHours;
    })
    .slice(0, 3)
    .map((d) => d.evaluation.developer);

  return {
    id: technologyIdFromName(profile.technology),
    name: profile.technology,
    status: profile.status,
    statusLabel: profile.status,
    engineeringHealth: profile.engineeringHealth,
    engineeringValueDeliveredHours: profile.engineeringValueDeliveredHours,
    recoveryHours: profile.recoveryHours,
    capacity: profile.engineeringHealth,
    deliveryEfficiency: profile.execution,
    developers: profile.developerCount,
    topContributors,
    trend: technologyTrend(profile.technology),
  };
}
