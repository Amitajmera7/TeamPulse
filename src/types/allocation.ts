import type { MetricStatus } from "@/types/dashboard";

/**
 * TeamPulse — Allocation Read Model (internal contract)
 *
 * This is the ONLY shape the Allocation UI is allowed to consume. Raw Jira
 * fields never reach a component:
 *
 *   Jira → Fetch Active Issues → Normalize → Allocation Read Model → UI
 *
 * Nothing here assumes a specific Jira instance. Developer names, project
 * keys, technologies, teams, issue types and status names are all open
 * strings supplied by the model. Anything the UI must branch on is a closed
 * union owned by TeamPulse (load bands, Jira status categories, KPI icons)
 * so a new Jira instance can never introduce an unhandled value.
 */

/** TeamPulse load bands. Product concept — not sourced from Jira. */
export type AllocationLoadStatus = "available" | "light" | "busy" | "overloaded";

/**
 * Jira status *categories* are a fixed set of three in every Jira Cloud
 * instance. Status *names* are arbitrary per instance, so the UI colours by
 * category and labels by name.
 */
export type AllocationStatusCategory = "to-do" | "in-progress" | "done";

/** Semantic icon slot chosen by the read model, resolved to a Lucide icon in the UI. */
export type AllocationKpiIcon =
  | "availability"
  | "overload"
  | "workload"
  | "schedule"
  | "confidence"
  | "projects"
  | "generic";

/** Generic option for any dynamic dropdown. `count` is optional metadata. */
export interface AllocationOption {
  value: string;
  label: string;
  count?: number;
}

export interface AllocationIssueStatus {
  id: string;
  name: string;
  category: AllocationStatusCategory;
}

export interface AllocationIssueType {
  id: string;
  name: string;
}

export interface AllocationProjectRef {
  id: string;
  key: string;
  name: string;
}

export interface AllocationAssigneeRef {
  id: string;
  accountId: string;
  displayName: string;
  initials: string;
  avatarUrl: string | null;
}

/**
 * A project rolled up across the whole instance. Roll-ups cover *assigned*
 * active work so they reconcile with `capacity.totalRemainingHours`;
 * unassigned work is reported separately via `meta.unassignedAssignments`.
 */
export interface AllocationProject extends AllocationProjectRef {
  remainingHours: number;
  developerCount: number;
  assignmentCount: number;
  sharePercent: number;
}

/** One project's slice of a single developer's remaining work. */
export interface AllocationDeveloperProject {
  projectId: string;
  key: string;
  name: string;
  remainingHours: number;
  sharePercent: number;
}

export interface AllocationDeveloper {
  id: string;
  accountId: string;
  displayName: string;
  initials: string;
  avatarUrl: string | null;
  /** Optional — many Jira instances have no technology concept at all. */
  technology: string | null;
  /** Optional — teams are not guaranteed to exist. */
  team: string | null;
  projects: AllocationDeveloperProject[];
  activeAssignments: number;
  unestimatedAssignments: number;
  remainingHours: number;
  remainingDays: number;
  /** ISO date. `null` means available now. */
  freeByDate: string | null;
  freeByLabel: string;
  status: AllocationLoadStatus;
  statusLabel: string;
  occupancyPercent: number;
}

export interface AllocationAssignment {
  id: string;
  issueKey: string;
  summary: string;
  issueType: AllocationIssueType;
  status: AllocationIssueStatus;
  /** `null` when the instance has no estimate for this issue. */
  estimateHours: number | null;
  loggedHours: number;
  /** `null` when it cannot be stated because the estimate is missing. */
  remainingHours: number | null;
  freeByLabel: string;
  /** `null` for unassigned active work. */
  assignee: AllocationAssigneeRef | null;
  project: AllocationProjectRef;
}

export interface AllocationKpi {
  id: string;
  title: string;
  value: string;
  icon: AllocationKpiIcon;
  status: MetricStatus;
  statusLabel: string;
  caption: string;
}

export interface AllocationLoadBand {
  status: AllocationLoadStatus;
  label: string;
  developerCount: number;
}

export interface AllocationCapacitySnapshot {
  totalRemainingHours: number;
  totalRemainingDays: number;
  activeAssignments: number;
  developerCount: number;
  workingDayHours: number;
  loadBands: AllocationLoadBand[];
  projects: AllocationProject[];
}

export interface AllocationTotals {
  estimateHours: number;
  loggedHours: number;
  remainingHours: number;
  assignmentCount: number;
  developerCount: number;
  projectCount: number;
  unestimatedAssignments: number;
}

export interface AllocationSummary {
  headline: string;
  lastUpdatedLabel: string;
  workingDayLabel: string;
  dataSourceLabel: string;
}

export interface AllocationFilterOptions {
  projects: AllocationOption[];
  technologies: AllocationOption[];
  developers: AllocationOption[];
  loadStatuses: AllocationOption[];
  issueTypes: AllocationOption[];
  teams: AllocationOption[];
}

export interface AllocationMeta {
  generatedAt: string;
  dataSource: "mock" | "jira";
  workingDayHours: number;
  unassignedAssignments: number;
  limitations: string[];
}

/** Root contract. Sprint 3 returns exactly this from the read service. */
export interface AllocationReadModel {
  summary: AllocationSummary;
  kpis: AllocationKpi[];
  capacity: AllocationCapacitySnapshot;
  developers: AllocationDeveloper[];
  projects: AllocationProject[];
  assignments: AllocationAssignment[];
  totals: AllocationTotals;
  filterOptions: AllocationFilterOptions;
  meta: AllocationMeta;
}

/**
 * View-layer grouping of a flat `assignments[]` collection. Built in the UI
 * so the read model stays a normalized, non-duplicated payload.
 */
export interface AllocationAssignmentGroup {
  id: string;
  label: string;
  developer: AllocationDeveloper | null;
  assignments: AllocationAssignment[];
}
