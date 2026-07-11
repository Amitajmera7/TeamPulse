/**
 * Project list/detail from EAW issue + allocation facts (no scored metrics).
 */

import { createPostgresWarehouseRepositories } from "@/services/engineering-warehouse";
import type { EngineeringIssue } from "@/services/engineering-warehouse";

import type {
  ExplorerProjectDetail,
  ExplorerProjectIssueRow,
  ExplorerProjectListItem,
} from "./types";

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function isStoryType(issueType: string): boolean {
  return issueType.toLowerCase().includes("story");
}

function buildProjectListItem(
  projectKey: string,
  issues: readonly EngineeringIssue[],
  hoursByIssue: Map<string, number>
): ExplorerProjectListItem {
  const engineeringHours = issues.reduce(
    (sum, issue) => sum + (hoursByIssue.get(issue.issueKey) ?? 0),
    0
  );

  return {
    id: projectKey,
    projectKey,
    issues: issues.length,
    stories: issues.filter((issue) => isStoryType(issue.issueType)).length,
    engineeringHours: Number(engineeringHours.toFixed(2)),
    engineeringScore: null,
    trend: [],
    source: "eaw",
  };
}

async function loadLatestBatchIssues(): Promise<{
  issues: EngineeringIssue[];
  hoursByIssue: Map<string, number>;
  available: boolean;
}> {
  if (!isDatabaseConfigured()) {
    return { issues: [], hoursByIssue: new Map(), available: false };
  }

  try {
    const repos = createPostgresWarehouseRepositories();
    const batches = await repos.syncBatches.findRecent(1, 0);
    const batch = batches[0];
    if (!batch) {
      return { issues: [], hoursByIssue: new Map(), available: true };
    }

    const [issues, allocations] = await Promise.all([
      repos.issues.findByBatch(batch.batchId),
      repos.allocations.findByBatch(batch.batchId),
    ]);

    const hoursByIssue = new Map<string, number>();
    for (const allocation of allocations) {
      hoursByIssue.set(
        allocation.issueKey,
        (hoursByIssue.get(allocation.issueKey) ?? 0) + allocation.actualHours
      );
    }

    return {
      issues: [...issues],
      hoursByIssue,
      available: true,
    };
  } catch {
    return { issues: [], hoursByIssue: new Map(), available: false };
  }
}

/**
 * Groups latest-batch EAW issues into project list rows.
 */
export async function loadExplorerProjects(): Promise<{
  projects: ExplorerProjectListItem[];
  warehouseAvailable: boolean;
  issueKeys: string[];
}> {
  const { issues, hoursByIssue, available } = await loadLatestBatchIssues();

  if (!available) {
    return { projects: [], warehouseAvailable: false, issueKeys: [] };
  }

  const byProject = new Map<string, EngineeringIssue[]>();
  for (const issue of issues) {
    const key = issue.projectKey || "UNKNOWN";
    const list = byProject.get(key) ?? [];
    list.push(issue);
    byProject.set(key, list);
  }

  const projects = [...byProject.entries()]
    .map(([projectKey, projectIssues]) =>
      buildProjectListItem(projectKey, projectIssues, hoursByIssue)
    )
    .sort((a, b) => a.projectKey.localeCompare(b.projectKey));

  return {
    projects,
    warehouseAvailable: true,
    issueKeys: issues.map((issue) => issue.issueKey),
  };
}

/**
 * Loads one project detail from latest EAW batch facts.
 */
export async function loadExplorerProjectDetail(
  projectId: string
): Promise<ExplorerProjectDetail | null> {
  const decoded = decodeURIComponent(projectId);
  const { issues, hoursByIssue, available } = await loadLatestBatchIssues();

  if (!available) {
    return {
      id: decoded,
      project: {
        id: decoded,
        projectKey: decoded,
        issues: 0,
        stories: 0,
        engineeringHours: 0,
        engineeringScore: null,
        trend: [],
        source: "unavailable",
      },
      issues: [],
      technologies: [],
      reportingPeriod: null,
      generatedAt: null,
      meta: {
        limitations: [
          "Warehouse unavailable — project facts cannot be loaded.",
          "Engineering Score is not projected by project in the Analytics Snapshot.",
        ],
      },
    };
  }

  const projectIssues = issues.filter(
    (issue) => issue.projectKey === decoded || issue.issueKey.startsWith(`${decoded}-`)
  );

  if (projectIssues.length === 0) {
    return null;
  }

  const project = buildProjectListItem(decoded, projectIssues, hoursByIssue);
  const issueRows: ExplorerProjectIssueRow[] = projectIssues.map((issue) => ({
    issueKey: issue.issueKey,
    summary: issue.summary,
    technology: issue.technology,
    status: issue.status,
    issueType: issue.issueType,
    month: issue.month,
  }));

  const technologies = [
    ...new Set(projectIssues.map((issue) => issue.technology).filter(Boolean)),
  ].sort();

  return {
    id: decoded,
    project,
    issues: issueRows,
    technologies,
    reportingPeriod: null,
    generatedAt: null,
    meta: {
      limitations: [
        "Project view uses Engineering Analytics Warehouse issue/allocation facts only.",
        "Engineering Score and trends are not available by project (no Project Profile engine).",
      ],
    },
  };
}
