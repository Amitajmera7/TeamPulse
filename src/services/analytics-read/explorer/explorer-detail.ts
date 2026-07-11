/**
 * Explorer detail builders — map existing snapshot / EAW outputs only.
 */

import { isUsableAnalyticsSnapshot } from "@/services/dashboard-repository/get-dashboard-data";
import { getLatestCompletedSnapshot } from "@/services/snapshot";
import { getReportingPeriod } from "@/services/dashboard/utils";

import { loadExplorerProjectDetail } from "./load-explorer-projects";
import {
  mapDeveloperToExplorerItem,
  mapTechnologyToExplorerItem,
  technologyNameFromId,
} from "./map-explorer-items";
import type {
  ExplorerDeveloperDetail,
  ExplorerTechnologyDetail,
} from "./types";

/**
 * Developer detail from completed Analytics Snapshot profiles.
 */
export function getExplorerDeveloperDetail(
  id: string
): ExplorerDeveloperDetail | null {
  const decoded = decodeURIComponent(id);
  const snapshot = getLatestCompletedSnapshot();

  if (!isUsableAnalyticsSnapshot(snapshot)) {
    return null;
  }

  const profile = snapshot.developerProfiles.find(
    (item) => item.evaluation.developer === decoded
  );

  if (!profile) {
    return null;
  }

  return {
    id: decoded,
    developer: mapDeveloperToExplorerItem(profile),
    scoreComponents: {
      execution: profile.engineeringScoreDetail?.components.execution ?? null,
      quality: profile.engineeringScoreDetail?.components.quality ?? null,
      contribution:
        profile.engineeringScoreDetail?.components.contribution ?? null,
    },
    completedTasks: profile.evaluation.contribution.completedTasks,
    reportingPeriod: snapshot.reportingPeriod,
    generatedAt: snapshot.generatedAt,
    meta: {
      limitations: [
        "Values are read from the completed Analytics Snapshot — no formula recalculation.",
      ],
    },
  };
}

/**
 * Technology detail from completed Analytics Snapshot profiles.
 */
export function getExplorerTechnologyDetail(
  id: string
): ExplorerTechnologyDetail | null {
  const decoded = decodeURIComponent(id);
  const snapshot = getLatestCompletedSnapshot();

  if (!isUsableAnalyticsSnapshot(snapshot)) {
    return null;
  }

  const techName =
    technologyNameFromId(decoded) ??
    snapshot.technologyProfiles.find(
      (profile) =>
        profile.technology.toLowerCase() === decoded.toLowerCase() ||
        profile.technology === decoded
    )?.technology;

  if (!techName) {
    return null;
  }

  const profile = snapshot.technologyProfiles.find(
    (item) => item.technology === techName
  );

  if (!profile) {
    return null;
  }

  const developers = snapshot.developerProfiles
    .filter((item) => item.evaluation.technology === techName)
    .map(mapDeveloperToExplorerItem);

  return {
    id: mapTechnologyToExplorerItem(profile, snapshot.developerProfiles).id,
    technology: mapTechnologyToExplorerItem(
      profile,
      snapshot.developerProfiles
    ),
    developers,
    reportingPeriod: snapshot.reportingPeriod ?? getReportingPeriod(),
    generatedAt: snapshot.generatedAt,
    meta: {
      limitations: [
        "Values are read from the completed Analytics Snapshot — no formula recalculation.",
      ],
    },
  };
}

export { loadExplorerProjectDetail as getExplorerProjectDetail };
