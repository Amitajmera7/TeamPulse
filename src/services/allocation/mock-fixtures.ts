import type {
  AllocationIssueStatus,
  AllocationIssueType,
  AllocationLoadStatus,
} from "@/types/allocation";

/**
 * TeamPulse — Allocation FIXTURES (Sprint 2)
 *
 * Sample data for a fictional Jira Cloud instance. Deliberately shares
 * nothing with TeamPulse's own developer/technology/project config so the
 * module cannot quietly depend on one customer's vocabulary.
 *
 * This file is data only. It is deleted when Sprint 3 introduces the real
 * normalize + read-service pipeline. It contains no business rules: every
 * hour/day pair below is authored by hand, never derived, so none of the
 * Allocation Engine's formulas (negative flooring, hours→days conversion,
 * weekend skipping) exist anywhere in the codebase yet.
 */

export interface MockEffort {
  estimateHours: number | null;
  loggedHours: number;
  remainingHours: number | null;
  statusIndex: number;
  typeIndex: number;
}

export interface MockWorkloadProfile {
  status: AllocationLoadStatus;
  statusLabel: string;
  /** Authored, not computed. */
  remainingHours: number;
  /** Authored, not computed. */
  remainingDays: number;
  occupancyPercent: number;
  effort: MockEffort[];
}

export interface MockRosterEntry {
  accountId: string;
  displayName: string;
  initials: string;
  technology: string | null;
  team: string | null;
  profile: keyof typeof MOCK_WORKLOAD_PROFILES;
  /** Indexes into MOCK_PROJECT_POOL. */
  projects: number[];
  freeByLabel: string;
  freeByDate: string | null;
}

export interface MockUnassignedEntry extends MockEffort {
  projectIndex: number;
}

/** Eight projects with instance-specific keys and names. */
export const MOCK_PROJECT_POOL = [
  { id: "10100", key: "APOLLO", name: "Apollo Storefront" },
  { id: "10101", key: "NOVA", name: "Nova Payments" },
  { id: "10102", key: "HELIOS", name: "Helios Data Platform" },
  { id: "10103", key: "ORION", name: "Orion Mobile App" },
  { id: "10104", key: "VEGA", name: "Vega Integrations" },
  { id: "10105", key: "ATLAS", name: "Atlas Admin Console" },
  { id: "10106", key: "IRIS", name: "Iris Design System" },
  { id: "10107", key: "ZEPHYR", name: "Zephyr Infrastructure" },
] as const;

/** Non-default status names — proves the UI colours by category, not by name. */
export const MOCK_STATUS_POOL: AllocationIssueStatus[] = [
  { id: "10001", name: "Backlog", category: "to-do" },
  { id: "10002", name: "Selected for Development", category: "to-do" },
  { id: "10003", name: "In Development", category: "in-progress" },
  { id: "10004", name: "Code Review", category: "in-progress" },
  { id: "10005", name: "Awaiting QA", category: "in-progress" },
  { id: "10006", name: "Blocked", category: "in-progress" },
];

export const MOCK_ISSUE_TYPE_POOL: AllocationIssueType[] = [
  { id: "10200", name: "Story" },
  { id: "10201", name: "Bug" },
  { id: "10202", name: "Task" },
  { id: "10203", name: "Sub-task" },
  { id: "10204", name: "Spike" },
];

export const MOCK_SUMMARY_POOL = [
  "Refine checkout validation states",
  "Migrate account settings to the new form layer",
  "Harden webhook retry handling",
  "Reduce cold-start latency on the API gateway",
  "Rebuild the notification preferences screen",
  "Add pagination to the audit log viewer",
  "Fix intermittent session expiry on mobile",
  "Introduce optimistic updates to the cart",
  "Consolidate duplicate address records",
  "Instrument release health dashboards",
  "Upgrade the design token pipeline",
  "Replace the legacy CSV export job",
  "Add role-based access to admin actions",
  "Resolve duplicate payment gateway callbacks",
  "Improve search relevance for product listings",
  "Backfill missing order metadata",
  "Split the monolithic settings service",
  "Add offline support to the mobile shell",
  "Rewrite the onboarding progress tracker",
  "Tighten rate limits on public endpoints",
  "Fix layout shift on the product gallery",
  "Automate schema migration verification",
  "Deprecate the v1 reporting endpoint",
  "Add accessibility labels to the data grid",
];

/** Fallback band vocabulary — TeamPulse product wording, not Jira data. */
export const MOCK_LOAD_BAND_LABELS: Record<AllocationLoadStatus, string> = {
  available: "Available",
  light: "Light",
  busy: "Busy",
  overloaded: "Overloaded",
};

/**
 * Each profile's effort entries sum exactly to `remainingHours`; unestimated
 * entries contribute nothing. Both figures are authored together by hand.
 */
export const MOCK_WORKLOAD_PROFILES = {
  idle: {
    status: "available",
    statusLabel: "Ready",
    remainingHours: 0,
    remainingDays: 0,
    occupancyPercent: 0,
    effort: [],
  },
  finishing: {
    status: "available",
    statusLabel: "Ready",
    remainingHours: 0,
    remainingDays: 0,
    occupancyPercent: 5,
    effort: [
      { estimateHours: null, loggedHours: 6, remainingHours: null, statusIndex: 4, typeIndex: 1 },
    ],
  },
  light8: {
    status: "light",
    statusLabel: "Light load",
    remainingHours: 8,
    remainingDays: 1.3,
    occupancyPercent: 18,
    effort: [
      { estimateHours: 10, loggedHours: 7, remainingHours: 3, statusIndex: 3, typeIndex: 0 },
      { estimateHours: 9, loggedHours: 4, remainingHours: 5, statusIndex: 2, typeIndex: 2 },
    ],
  },
  light16: {
    status: "light",
    statusLabel: "Light load",
    remainingHours: 16,
    remainingDays: 2.5,
    occupancyPercent: 30,
    effort: [
      { estimateHours: 20, loggedHours: 10, remainingHours: 10, statusIndex: 2, typeIndex: 0 },
      { estimateHours: 12, loggedHours: 6, remainingHours: 6, statusIndex: 3, typeIndex: 2 },
      { estimateHours: null, loggedHours: 3, remainingHours: null, statusIndex: 0, typeIndex: 1 },
    ],
  },
  busy26: {
    status: "busy",
    statusLabel: "Busy",
    remainingHours: 26,
    remainingDays: 4.1,
    occupancyPercent: 45,
    effort: [
      { estimateHours: 18, loggedHours: 6, remainingHours: 12, statusIndex: 2, typeIndex: 0 },
      { estimateHours: 20, loggedHours: 6, remainingHours: 14, statusIndex: 2, typeIndex: 0 },
      { estimateHours: null, loggedHours: 2, remainingHours: null, statusIndex: 1, typeIndex: 4 },
      { estimateHours: 6, loggedHours: 6, remainingHours: 0, statusIndex: 4, typeIndex: 1 },
    ],
  },
  busy34: {
    status: "busy",
    statusLabel: "Busy",
    remainingHours: 34,
    remainingDays: 5.3,
    occupancyPercent: 55,
    effort: [
      { estimateHours: 24, loggedHours: 8, remainingHours: 16, statusIndex: 2, typeIndex: 0 },
      { estimateHours: 22, loggedHours: 4, remainingHours: 18, statusIndex: 3, typeIndex: 0 },
      { estimateHours: null, loggedHours: 0, remainingHours: null, statusIndex: 0, typeIndex: 2 },
      { estimateHours: 4, loggedHours: 4, remainingHours: 0, statusIndex: 4, typeIndex: 3 },
    ],
  },
  busy48: {
    status: "busy",
    statusLabel: "Busy",
    remainingHours: 48,
    remainingDays: 7.5,
    occupancyPercent: 70,
    effort: [
      { estimateHours: 30, loggedHours: 8, remainingHours: 22, statusIndex: 2, typeIndex: 0 },
      { estimateHours: 28, loggedHours: 4, remainingHours: 24, statusIndex: 5, typeIndex: 0 },
      { estimateHours: 6, loggedHours: 4, remainingHours: 2, statusIndex: 3, typeIndex: 1 },
      { estimateHours: 10, loggedHours: 10, remainingHours: 0, statusIndex: 4, typeIndex: 2 },
      { estimateHours: null, loggedHours: 1, remainingHours: null, statusIndex: 0, typeIndex: 4 },
    ],
  },
  busy60: {
    status: "busy",
    statusLabel: "Busy",
    remainingHours: 60,
    remainingDays: 9.4,
    occupancyPercent: 85,
    effort: [
      { estimateHours: 40, loggedHours: 14, remainingHours: 26, statusIndex: 2, typeIndex: 0 },
      { estimateHours: 36, loggedHours: 6, remainingHours: 30, statusIndex: 2, typeIndex: 0 },
      { estimateHours: 8, loggedHours: 4, remainingHours: 4, statusIndex: 3, typeIndex: 1 },
      { estimateHours: null, loggedHours: 0, remainingHours: null, statusIndex: 1, typeIndex: 2 },
      { estimateHours: 12, loggedHours: 12, remainingHours: 0, statusIndex: 4, typeIndex: 3 },
    ],
  },
  over78: {
    status: "overloaded",
    statusLabel: "Overloaded",
    remainingHours: 78,
    remainingDays: 12.2,
    occupancyPercent: 96,
    effort: [
      { estimateHours: 40, loggedHours: 14, remainingHours: 26, statusIndex: 2, typeIndex: 0 },
      { estimateHours: 56, loggedHours: 4, remainingHours: 52, statusIndex: 5, typeIndex: 0 },
      { estimateHours: null, loggedHours: 0, remainingHours: null, statusIndex: 0, typeIndex: 2 },
      { estimateHours: 5, loggedHours: 5, remainingHours: 0, statusIndex: 4, typeIndex: 1 },
    ],
  },
  over96: {
    status: "overloaded",
    statusLabel: "Overloaded",
    remainingHours: 96,
    remainingDays: 15,
    occupancyPercent: 100,
    effort: [
      { estimateHours: 30, loggedHours: 10, remainingHours: 20, statusIndex: 2, typeIndex: 0 },
      { estimateHours: 26, loggedHours: 6, remainingHours: 20, statusIndex: 3, typeIndex: 0 },
      { estimateHours: 68, loggedHours: 12, remainingHours: 56, statusIndex: 2, typeIndex: 0 },
      { estimateHours: null, loggedHours: 0, remainingHours: null, statusIndex: 1, typeIndex: 4 },
      { estimateHours: 9, loggedHours: 9, remainingHours: 0, statusIndex: 4, typeIndex: 1 },
    ],
  },
  over120: {
    status: "overloaded",
    statusLabel: "Overloaded",
    remainingHours: 120,
    remainingDays: 18.8,
    occupancyPercent: 100,
    effort: [
      { estimateHours: 50, loggedHours: 20, remainingHours: 30, statusIndex: 2, typeIndex: 0 },
      { estimateHours: 44, loggedHours: 4, remainingHours: 40, statusIndex: 5, typeIndex: 0 },
      { estimateHours: 60, loggedHours: 10, remainingHours: 50, statusIndex: 2, typeIndex: 0 },
      { estimateHours: null, loggedHours: 0, remainingHours: null, statusIndex: 0, typeIndex: 2 },
      { estimateHours: 7, loggedHours: 7, remainingHours: 0, statusIndex: 4, typeIndex: 1 },
      { estimateHours: 3, loggedHours: 3, remainingHours: 0, statusIndex: 3, typeIndex: 3 },
    ],
  },
} satisfies Record<string, MockWorkloadProfile>;

/** Twenty people. Some have no technology and no team — both are optional. */
export const MOCK_ROSTER: MockRosterEntry[] = [
  { accountId: "5f8a1b2c3d4e5f0000000001", displayName: "Amara Okafor", initials: "AO", technology: "Platform", team: "Core Platform", profile: "idle", projects: [0], freeByLabel: "Available now", freeByDate: null },
  { accountId: "5f8a1b2c3d4e5f0000000002", displayName: "Bjorn Lindqvist", initials: "BL", technology: "Frontend", team: "Storefront", profile: "finishing", projects: [0, 6], freeByLabel: "Available now", freeByDate: null },
  { accountId: "5f8a1b2c3d4e5f0000000003", displayName: "Chen Wei", initials: "CW", technology: null, team: "Data", profile: "idle", projects: [2], freeByLabel: "Available now", freeByDate: null },
  { accountId: "5f8a1b2c3d4e5f0000000004", displayName: "Diego Herrera", initials: "DH", technology: "Backend", team: "Payments", profile: "finishing", projects: [1], freeByLabel: "Available now", freeByDate: null },
  { accountId: "5f8a1b2c3d4e5f0000000005", displayName: "Elena Petrova", initials: "EP", technology: "Frontend", team: "Storefront", profile: "finishing", projects: [0], freeByLabel: "Available now", freeByDate: null },
  { accountId: "5f8a1b2c3d4e5f0000000006", displayName: "Farid Haddad", initials: "FH", technology: "Mobile", team: "Mobile", profile: "light8", projects: [3, 6], freeByLabel: "Mon, Jul 27", freeByDate: "2026-07-27" },
  { accountId: "5f8a1b2c3d4e5f0000000007", displayName: "Grace Mwangi", initials: "GM", technology: "Backend", team: "Payments", profile: "light16", projects: [1, 4], freeByLabel: "Tue, Jul 28", freeByDate: "2026-07-28" },
  { accountId: "5f8a1b2c3d4e5f0000000008", displayName: "Hana Sato", initials: "HS", technology: "QA Automation", team: null, profile: "light8", projects: [5], freeByLabel: "Mon, Jul 27", freeByDate: "2026-07-27" },
  { accountId: "5f8a1b2c3d4e5f0000000009", displayName: "Ibrahim Yusuf", initials: "IY", technology: "Data Engineering", team: "Data", profile: "light16", projects: [2, 7], freeByLabel: "Wed, Jul 29", freeByDate: "2026-07-29" },
  { accountId: "5f8a1b2c3d4e5f0000000010", displayName: "Julia Kowalski", initials: "JK", technology: "Frontend", team: "Design Systems", profile: "light16", projects: [6], freeByLabel: "Tue, Jul 28", freeByDate: "2026-07-28" },
  { accountId: "5f8a1b2c3d4e5f0000000011", displayName: "Kai Nakamura", initials: "KN", technology: "Backend", team: "Core Platform", profile: "busy26", projects: [7, 0], freeByLabel: "Thu, Jul 30", freeByDate: "2026-07-30" },
  { accountId: "5f8a1b2c3d4e5f0000000012", displayName: "Lucia Rossi", initials: "LR", technology: "Design Systems", team: "Design Systems", profile: "busy34", projects: [6, 3], freeByLabel: "Fri, Jul 31", freeByDate: "2026-07-31" },
  { accountId: "5f8a1b2c3d4e5f0000000013", displayName: "Mateo Silva", initials: "MS", technology: "Mobile", team: "Mobile", profile: "busy48", projects: [3], freeByLabel: "Wed, Aug 5", freeByDate: "2026-08-05" },
  { accountId: "5f8a1b2c3d4e5f0000000014", displayName: "Nadia Rahman", initials: "NR", technology: "Platform", team: "Core Platform", profile: "busy60", projects: [7, 2], freeByLabel: "Fri, Aug 7", freeByDate: "2026-08-07" },
  { accountId: "5f8a1b2c3d4e5f0000000015", displayName: "Omar Farouk", initials: "OF", technology: null, team: null, profile: "busy48", projects: [4], freeByLabel: "Tue, Aug 4", freeByDate: "2026-08-04" },
  { accountId: "5f8a1b2c3d4e5f0000000016", displayName: "Priya Nair", initials: "PN", technology: "Backend", team: "Payments", profile: "busy34", projects: [1, 5], freeByLabel: "Fri, Jul 31", freeByDate: "2026-07-31" },
  { accountId: "5f8a1b2c3d4e5f0000000017", displayName: "Quinn O'Brien", initials: "QO", technology: "DevOps", team: "Infrastructure", profile: "over78", projects: [0, 4, 1], freeByLabel: "Wed, Aug 12", freeByDate: "2026-08-12" },
  { accountId: "5f8a1b2c3d4e5f0000000018", displayName: "Rafael Costa", initials: "RC", technology: "Backend", team: "Core Platform", profile: "over96", projects: [2, 7], freeByLabel: "Mon, Aug 17", freeByDate: "2026-08-17" },
  { accountId: "5f8a1b2c3d4e5f0000000019", displayName: "Sofia Marchetti", initials: "SM", technology: "Frontend", team: "Storefront", profile: "over120", projects: [5, 0, 3], freeByLabel: "Thu, Aug 20", freeByDate: "2026-08-20" },
  { accountId: "5f8a1b2c3d4e5f0000000020", displayName: "Tomas Novak", initials: "TN", technology: "DevOps", team: "Infrastructure", profile: "over96", projects: [1, 4], freeByLabel: "Tue, Aug 18", freeByDate: "2026-08-18" },
];

/** Active work nobody owns yet — a real condition in every Jira instance. */
export const MOCK_UNASSIGNED: MockUnassignedEntry[] = [
  { projectIndex: 0, estimateHours: 12, loggedHours: 0, remainingHours: 12, statusIndex: 0, typeIndex: 0 },
  { projectIndex: 1, estimateHours: null, loggedHours: 0, remainingHours: null, statusIndex: 0, typeIndex: 1 },
  { projectIndex: 2, estimateHours: 20, loggedHours: 0, remainingHours: 20, statusIndex: 1, typeIndex: 0 },
  { projectIndex: 3, estimateHours: 6, loggedHours: 0, remainingHours: 6, statusIndex: 0, typeIndex: 2 },
  { projectIndex: 4, estimateHours: null, loggedHours: 0, remainingHours: null, statusIndex: 0, typeIndex: 0 },
  { projectIndex: 5, estimateHours: 16, loggedHours: 0, remainingHours: 16, statusIndex: 1, typeIndex: 4 },
  { projectIndex: 6, estimateHours: 4, loggedHours: 0, remainingHours: 4, statusIndex: 0, typeIndex: 2 },
  { projectIndex: 7, estimateHours: 30, loggedHours: 0, remainingHours: 30, statusIndex: 0, typeIndex: 0 },
  { projectIndex: 0, estimateHours: null, loggedHours: 0, remainingHours: null, statusIndex: 1, typeIndex: 1 },
  { projectIndex: 2, estimateHours: 24, loggedHours: 0, remainingHours: 24, statusIndex: 0, typeIndex: 0 },
  { projectIndex: 4, estimateHours: 8, loggedHours: 0, remainingHours: 8, statusIndex: 1, typeIndex: 2 },
  { projectIndex: 7, estimateHours: null, loggedHours: 0, remainingHours: null, statusIndex: 0, typeIndex: 4 },
];
