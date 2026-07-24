import type {
  AllocationAssignment,
  AllocationAssigneeRef,
  AllocationCapacitySnapshot,
  AllocationDeveloper,
  AllocationDeveloperProject,
  AllocationFilterOptions,
  AllocationKpi,
  AllocationLoadBand,
  AllocationLoadStatus,
  AllocationOption,
  AllocationProject,
  AllocationReadModel,
  AllocationTotals,
} from "@/types/allocation";

import {
  MOCK_ISSUE_TYPE_POOL,
  MOCK_LOAD_BAND_LABELS,
  MOCK_PROJECT_POOL,
  MOCK_ROSTER,
  MOCK_STATUS_POOL,
  MOCK_SUMMARY_POOL,
  MOCK_UNASSIGNED,
  MOCK_WORKLOAD_PROFILES,
} from "./mock-fixtures";

/**
 * TeamPulse — Allocation mock read model (Sprint 2)
 *
 * FIXTURE ASSEMBLY ONLY. This composes the authored fixtures in
 * `mock-fixtures.ts` into one `AllocationReadModel` so the UI can be built
 * against the real contract before any Jira work exists.
 *
 * It is NOT the Allocation Engine and contains none of its rules: no
 * `estimate - logged`, no negative flooring, no hours → working-day
 * conversion, no weekend skipping. Every hour and day figure is read
 * straight from the fixtures; the only arithmetic here is roll-up
 * summation and display percentages, which Sprint 3 replaces wholesale.
 */

/** Carried as metadata for display. Never used as a divisor in Sprint 2. */
export const ALLOCATION_WORKING_DAY_HOURS = 6.4;

const LOAD_BAND_ORDER: AllocationLoadStatus[] = [
  "available",
  "light",
  "busy",
  "overloaded",
];

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function share(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function toOptions(values: string[]): AllocationOption[] {
  return values.map((value) => ({ value, label: value }));
}

function buildDeveloperProjects(
  own: AllocationAssignment[],
  totalRemaining: number
): AllocationDeveloperProject[] {
  const byProject = new Map<string, AllocationDeveloperProject>();

  for (const assignment of own) {
    if (assignment.remainingHours === null || assignment.remainingHours <= 0) {
      continue;
    }
    const current = byProject.get(assignment.project.id);
    if (current) {
      current.remainingHours += assignment.remainingHours;
      continue;
    }
    byProject.set(assignment.project.id, {
      projectId: assignment.project.id,
      key: assignment.project.key,
      name: assignment.project.name,
      remainingHours: assignment.remainingHours,
      sharePercent: 0,
    });
  }

  return [...byProject.values()]
    .map((entry) => ({
      ...entry,
      sharePercent: share(entry.remainingHours, totalRemaining),
    }))
    .sort((a, b) => b.remainingHours - a.remainingHours);
}

function buildProjectRollups(
  assignments: AllocationAssignment[]
): AllocationProject[] {
  const hours = new Map<string, number>();
  const counts = new Map<string, number>();
  const developerIds = new Map<string, Set<string>>();

  for (const assignment of assignments) {
    if (!assignment.assignee) {
      continue;
    }
    const id = assignment.project.id;
    hours.set(id, (hours.get(id) ?? 0) + (assignment.remainingHours ?? 0));
    counts.set(id, (counts.get(id) ?? 0) + 1);
    const owners = developerIds.get(id) ?? new Set<string>();
    owners.add(assignment.assignee.id);
    developerIds.set(id, owners);
  }

  const totalHours = [...hours.values()].reduce((sum, value) => sum + value, 0);

  return MOCK_PROJECT_POOL.map((project) => ({
    id: project.id,
    key: project.key,
    name: project.name,
    remainingHours: hours.get(project.id) ?? 0,
    assignmentCount: counts.get(project.id) ?? 0,
    developerCount: developerIds.get(project.id)?.size ?? 0,
    sharePercent: share(hours.get(project.id) ?? 0, totalHours),
  })).sort((a, b) => b.remainingHours - a.remainingHours);
}

function buildLoadBands(developers: AllocationDeveloper[]): AllocationLoadBand[] {
  return LOAD_BAND_ORDER.map((status) => {
    const matching = developers.filter((developer) => developer.status === status);
    return {
      status,
      label: matching[0]?.statusLabel ?? MOCK_LOAD_BAND_LABELS[status],
      developerCount: matching.length,
    };
  });
}

function buildTotals(
  developers: AllocationDeveloper[],
  assignments: AllocationAssignment[],
  projectCount: number
): AllocationTotals {
  return {
    estimateHours: assignments.reduce((sum, item) => sum + (item.estimateHours ?? 0), 0),
    loggedHours: assignments.reduce((sum, item) => sum + item.loggedHours, 0),
    remainingHours: assignments.reduce((sum, item) => sum + (item.remainingHours ?? 0), 0),
    assignmentCount: assignments.length,
    developerCount: developers.length,
    projectCount,
    unestimatedAssignments: assignments.filter((item) => item.estimateHours === null).length,
  };
}

function buildKpis(
  developers: AllocationDeveloper[],
  assignments: AllocationAssignment[],
  capacity: AllocationCapacitySnapshot,
  projects: AllocationProject[],
  totals: AllocationTotals
): AllocationKpi[] {
  const available = developers.filter((developer) => developer.status === "available");
  const overloaded = developers.filter((developer) => developer.status === "overloaded");
  const busiest = [...developers].sort((a, b) => b.remainingHours - a.remainingHours)[0];
  const nextFree = developers.find((developer) => developer.freeByDate !== null);
  const topProject = projects[0];
  const estimated = totals.assignmentCount - totals.unestimatedAssignments;

  return [
    {
      id: "ready-for-work",
      title: "Ready For Work",
      value: String(available.length),
      icon: "availability",
      status: available.length > 0 ? "healthy" : "attention",
      statusLabel: available.length > 0 ? "Available" : "None free",
      caption: `of ${developers.length} active developers`,
    },
    {
      id: "overloaded",
      title: "Overloaded",
      value: String(overloaded.length),
      icon: "overload",
      status: overloaded.length > 0 ? "attention" : "healthy",
      statusLabel: overloaded.length > 0 ? "Needs balancing" : "Balanced",
      caption:
        overloaded.length > 0 && busiest
          ? `Heaviest: ${busiest.displayName} · ${busiest.remainingHours}h`
          : "No developer is over capacity",
    },
    {
      id: "work-in-hand",
      title: "Work In Hand",
      value: `${capacity.totalRemainingHours}h`,
      icon: "workload",
      status: "neutral",
      statusLabel: "Assigned",
      caption: `≈ ${capacity.totalRemainingDays} working days at ${capacity.workingDayHours}h/day`,
    },
    {
      id: "next-capacity-opens",
      title: "Next Capacity Opens",
      value: nextFree ? nextFree.freeByLabel : "—",
      icon: "schedule",
      status: nextFree ? "on-track" : "healthy",
      statusLabel: nextFree ? "Upcoming" : "All free",
      caption: nextFree
        ? [nextFree.displayName, nextFree.technology].filter(Boolean).join(" · ")
        : "Every developer is available now",
    },
    {
      id: "estimation-confidence",
      title: "Estimation Confidence",
      value: `${share(estimated, totals.assignmentCount)}%`,
      icon: "confidence",
      status: totals.unestimatedAssignments > 0 ? "attention" : "healthy",
      statusLabel: totals.unestimatedAssignments > 0 ? "Needs review" : "Complete",
      caption: `${totals.unestimatedAssignments} of ${totals.assignmentCount} assignments unestimated`,
    },
    {
      id: "projects-running",
      title: "Projects Running",
      value: String(projects.filter((project) => project.assignmentCount > 0).length),
      icon: "projects",
      status: "neutral",
      statusLabel: "Active projects",
      caption: topProject
        ? `${topProject.key} holds ${topProject.sharePercent}% of remaining capacity`
        : `${assignments.length} assignments in scope`,
    },
  ];
}

function buildFilterOptions(
  developers: AllocationDeveloper[],
  assignments: AllocationAssignment[],
  projects: AllocationProject[],
  bands: AllocationLoadBand[]
): AllocationFilterOptions {
  const technologies = [
    ...new Set(
      developers
        .map((developer) => developer.technology)
        .filter((value): value is string => Boolean(value))
    ),
  ].sort();

  const teams = [
    ...new Set(
      developers
        .map((developer) => developer.team)
        .filter((value): value is string => Boolean(value))
    ),
  ].sort();

  const issueTypes = [
    ...new Set(assignments.map((assignment) => assignment.issueType.name)),
  ].sort();

  return {
    projects: projects.map((project) => ({
      value: project.key,
      label: `${project.key} · ${project.name}`,
      count: project.assignmentCount,
    })),
    technologies: toOptions(technologies),
    developers: developers.map((developer) => ({
      value: developer.id,
      label: developer.displayName,
      count: developer.activeAssignments,
    })),
    loadStatuses: bands.map((band) => ({
      value: band.status,
      label: band.label,
      count: band.developerCount,
    })),
    issueTypes: toOptions(issueTypes),
    teams: toOptions(teams),
  };
}

function buildModel(): AllocationReadModel {
  const developers: AllocationDeveloper[] = [];
  const assignments: AllocationAssignment[] = [];
  const issueNumbers = new Map<string, number>();
  let summaryCursor = 0;

  function nextIssueKey(projectKey: string): string {
    const next = (issueNumbers.get(projectKey) ?? 100) + 1;
    issueNumbers.set(projectKey, next);
    return `${projectKey}-${next}`;
  }

  MOCK_ROSTER.forEach((entry, index) => {
    const profile = MOCK_WORKLOAD_PROFILES[entry.profile];
    const assignee: AllocationAssigneeRef = {
      id: `dev-${index + 1}`,
      accountId: entry.accountId,
      displayName: entry.displayName,
      initials: entry.initials,
      avatarUrl: null,
    };
    const ownProjects = entry.projects.map((projectIndex) => MOCK_PROJECT_POOL[projectIndex]);

    const own: AllocationAssignment[] = profile.effort.map((effort, effortIndex) => {
      const project = ownProjects[effortIndex % ownProjects.length];
      const summary = MOCK_SUMMARY_POOL[summaryCursor % MOCK_SUMMARY_POOL.length];
      summaryCursor += 1;

      return {
        id: `${assignee.id}-issue-${effortIndex + 1}`,
        issueKey: nextIssueKey(project.key),
        summary,
        issueType: MOCK_ISSUE_TYPE_POOL[effort.typeIndex],
        status: MOCK_STATUS_POOL[effort.statusIndex],
        estimateHours: effort.estimateHours,
        loggedHours: effort.loggedHours,
        remainingHours: effort.remainingHours,
        freeByLabel: entry.freeByLabel,
        assignee,
        project: { id: project.id, key: project.key, name: project.name },
      };
    });

    assignments.push(...own);

    developers.push({
      id: assignee.id,
      accountId: assignee.accountId,
      displayName: assignee.displayName,
      initials: assignee.initials,
      avatarUrl: assignee.avatarUrl,
      technology: entry.technology,
      team: entry.team,
      projects: buildDeveloperProjects(own, profile.remainingHours),
      activeAssignments: own.length,
      unestimatedAssignments: own.filter((item) => item.estimateHours === null).length,
      remainingHours: profile.remainingHours,
      remainingDays: profile.remainingDays,
      freeByDate: entry.freeByDate,
      freeByLabel: entry.freeByLabel,
      status: profile.status,
      statusLabel: profile.statusLabel,
      occupancyPercent: profile.occupancyPercent,
    });
  });

  MOCK_UNASSIGNED.forEach((entry, index) => {
    const project = MOCK_PROJECT_POOL[entry.projectIndex];
    const summary = MOCK_SUMMARY_POOL[summaryCursor % MOCK_SUMMARY_POOL.length];
    summaryCursor += 1;

    assignments.push({
      id: `unassigned-issue-${index + 1}`,
      issueKey: nextIssueKey(project.key),
      summary,
      issueType: MOCK_ISSUE_TYPE_POOL[entry.typeIndex],
      status: MOCK_STATUS_POOL[entry.statusIndex],
      estimateHours: entry.estimateHours,
      loggedHours: entry.loggedHours,
      remainingHours: entry.remainingHours,
      freeByLabel: "—",
      assignee: null,
      project: { id: project.id, key: project.key, name: project.name },
    });
  });

  // Earliest availability first — the question the page exists to answer.
  developers.sort((a, b) => {
    if (a.freeByDate === b.freeByDate) {
      return a.remainingHours - b.remainingHours;
    }
    if (a.freeByDate === null) return -1;
    if (b.freeByDate === null) return 1;
    return a.freeByDate < b.freeByDate ? -1 : 1;
  });

  const projects = buildProjectRollups(assignments);
  const loadBands = buildLoadBands(developers);
  const totals = buildTotals(developers, assignments, projects.length);
  const unassignedCount = assignments.filter((item) => item.assignee === null).length;

  const capacity: AllocationCapacitySnapshot = {
    totalRemainingHours: developers.reduce((sum, item) => sum + item.remainingHours, 0),
    totalRemainingDays: round1(
      developers.reduce((sum, item) => sum + item.remainingDays, 0)
    ),
    activeAssignments: assignments.length - unassignedCount,
    developerCount: developers.length,
    workingDayHours: ALLOCATION_WORKING_DAY_HOURS,
    loadBands,
    projects,
  };

  const kpis = buildKpis(developers, assignments, capacity, projects, totals);
  const readyCount = loadBands.find((band) => band.status === "available")?.developerCount ?? 0;
  const overloadedCount =
    loadBands.find((band) => band.status === "overloaded")?.developerCount ?? 0;

  return {
    summary: {
      headline: `${readyCount} developers are ready for work. ${overloadedCount} require workload balancing. ${capacity.totalRemainingHours} hours remain across ${capacity.activeAssignments} assigned issues.`,
      lastUpdatedLabel: "Today, 12:41 PM",
      workingDayLabel: `${ALLOCATION_WORKING_DAY_HOURS}h / day`,
      dataSourceLabel: "Mock Data",
    },
    kpis,
    capacity,
    developers,
    projects,
    assignments,
    totals,
    filterOptions: buildFilterOptions(developers, assignments, projects, loadBands),
    meta: {
      generatedAt: "2026-07-25T12:41:00.000Z",
      dataSource: "mock",
      workingDayHours: ALLOCATION_WORKING_DAY_HOURS,
      unassignedAssignments: unassignedCount,
      limitations: [
        "Mock data — no Jira instance is connected yet.",
        "Project roll-ups cover assigned active work; unassigned issues are reported separately.",
      ],
    },
  };
}

/** Single frozen instance so React sees a stable reference across renders. */
export const MOCK_ALLOCATION_READ_MODEL: AllocationReadModel = buildModel();
