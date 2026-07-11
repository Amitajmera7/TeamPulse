/**
 * Builds ExplorerReadModel from Analytics Snapshot + optional EAW projects.
 */

import { isUsableAnalyticsSnapshot } from "@/services/dashboard-repository/get-dashboard-data";
import {
  sumEngineeringValueDeliveredHours,
  sumRecoveryHours,
  weightedAverageEngineeringScore,
} from "@/services/dashboard/build-kpis";
import { getReportingPeriod } from "@/services/dashboard/utils";
import { getLatestCompletedSnapshot } from "@/services/snapshot";
import { getSyncState } from "@/services/orchestrator";
import { weightedAverage } from "@/services/technology-profile";

import { loadExplorerProjects } from "./load-explorer-projects";
import {
  mapDeveloperToExplorerItem,
  mapTechnologyToExplorerItem,
} from "./map-explorer-items";
import type {
  ExplorerOverview,
  ExplorerReadModel,
  ExplorerSearchIndexEntry,
} from "./types";

function emptyOverview(): ExplorerOverview {
  return {
    developers: 0,
    technologies: 0,
    projects: 0,
    engineeringValueDeliveredHours: 0,
    recoveryHours: 0,
    engineeringScore: null,
    deliveryEfficiency: null,
  };
}

function buildSearchIndex(input: {
  developers: ReturnType<typeof mapDeveloperToExplorerItem>[];
  technologies: ReturnType<typeof mapTechnologyToExplorerItem>[];
  projects: ExplorerReadModel["projects"];
  issueKeys: readonly string[];
}): ExplorerSearchIndexEntry[] {
  const entries: ExplorerSearchIndexEntry[] = [];

  for (const developer of input.developers) {
    entries.push({
      id: developer.id,
      type: "developer",
      label: developer.name,
      subtitle: developer.technology || null,
      href: `/explorer/developers/${encodeURIComponent(developer.id)}`,
      keywords: [developer.name, developer.technology, developer.initials],
    });
  }

  for (const technology of input.technologies) {
    entries.push({
      id: technology.id,
      type: "technology",
      label: technology.name,
      subtitle: technology.statusLabel,
      href: `/explorer/technologies/${encodeURIComponent(technology.id)}`,
      keywords: [technology.name, technology.id, technology.statusLabel],
    });
  }

  for (const project of input.projects) {
    entries.push({
      id: project.id,
      type: "project",
      label: project.projectKey,
      subtitle: `${project.issues} issues`,
      href: `/explorer/projects/${encodeURIComponent(project.id)}`,
      keywords: [project.projectKey, project.id],
    });
  }

  for (const issueKey of input.issueKeys) {
    const projectKey = issueKey.includes("-")
      ? issueKey.slice(0, issueKey.indexOf("-"))
      : issueKey;
    entries.push({
      id: issueKey,
      type: "issue",
      label: issueKey,
      subtitle: projectKey,
      href: `/explorer/projects/${encodeURIComponent(projectKey)}`,
      keywords: [issueKey, projectKey],
    });
  }

  return entries;
}

/**
 * Assembles the Engineering Explorer overview + tab lists + search index.
 */
export async function buildExplorerReadModel(): Promise<ExplorerReadModel> {
  const snapshot = getLatestCompletedSnapshot();
  const syncStatus = getSyncState().status;
  const { projects, warehouseAvailable, issueKeys } =
    await loadExplorerProjects();
  const limitations: string[] = [];

  if (!isUsableAnalyticsSnapshot(snapshot)) {
    limitations.push(
      "No completed Analytics Snapshot — developer and technology lists are empty."
    );
    if (!warehouseAvailable) {
      limitations.push("Warehouse unavailable — project list is empty.");
    }

    return {
      reportingPeriod: getReportingPeriod(),
      generatedAt: null,
      syncStatus,
      overview: { ...emptyOverview(), projects: projects.length },
      developers: [],
      technologies: [],
      projects,
      searchIndex: buildSearchIndex({
        developers: [],
        technologies: [],
        projects,
        issueKeys,
      }),
      meta: {
        snapshotAvailable: false,
        warehouseAvailable,
        limitations,
      },
    };
  }

  const developers = snapshot.developerProfiles.map(mapDeveloperToExplorerItem);
  const technologies = snapshot.technologyProfiles.map((profile) =>
    mapTechnologyToExplorerItem(profile, snapshot.developerProfiles)
  );

  const deliveryEfficiency = weightedAverage(
    snapshot.developerProfiles
      .filter((profile) => profile.evaluation.execution.resolved)
      .map((profile) => ({
        value: profile.evaluation.execution.efficiencyScore,
        weight: profile.evaluation.contribution.deliveredEngineeringHours,
      }))
  );

  const overview: ExplorerOverview = {
    developers: developers.length,
    technologies: technologies.length,
    projects: projects.length,
    engineeringValueDeliveredHours: sumEngineeringValueDeliveredHours(
      snapshot.developerProfiles
    ),
    recoveryHours: sumRecoveryHours(snapshot.developerProfiles),
    engineeringScore:
      snapshot.dashboardData.engineeringScore.value > 0
        ? snapshot.dashboardData.engineeringScore.value
        : weightedAverageEngineeringScore(snapshot.developerProfiles),
    deliveryEfficiency,
  };

  if (!warehouseAvailable) {
    limitations.push(
      "Warehouse unavailable — Projects tab uses empty fallback."
    );
  }
  limitations.push(
    "Project Engineering Score is not available (no Project Profile in snapshot)."
  );

  // Issue keys included for Search architecture (developer / technology / project / issue).
  return {
    reportingPeriod: snapshot.reportingPeriod,
    generatedAt: snapshot.generatedAt,
    syncStatus,
    overview,
    developers,
    technologies,
    projects,
    searchIndex: buildSearchIndex({
      developers,
      technologies,
      projects,
      issueKeys,
    }),
    meta: {
      snapshotAvailable: true,
      warehouseAvailable,
      limitations,
    },
  };
}
