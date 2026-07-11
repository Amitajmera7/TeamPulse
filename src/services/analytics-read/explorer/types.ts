/**
 * Engineering Explorer read-model types (Analytics Read layer).
 * Assembled from snapshot / EAW facts — no formula recalculation.
 */

import type { DeveloperProfileStatus } from "@/services/developer-profile";
import type { ReportingPeriod } from "@/services/dashboard/types";
import type { TechnologyStatus } from "@/services/technology-profile";
import type { SyncStatus } from "@/services/snapshot";

export type ExplorerSearchEntityType =
  | "developer"
  | "technology"
  | "project"
  | "issue";

export interface ExplorerSearchIndexEntry {
  readonly id: string;
  readonly type: ExplorerSearchEntityType;
  readonly label: string;
  readonly subtitle: string | null;
  readonly href: string;
  readonly keywords: readonly string[];
}

export interface ExplorerOverview {
  readonly developers: number;
  readonly technologies: number;
  readonly projects: number;
  readonly engineeringValueDeliveredHours: number;
  readonly recoveryHours: number;
  readonly engineeringScore: number | null;
  readonly deliveryEfficiency: number | null;
}

export interface ExplorerDeveloperListItem {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly technology: string;
  readonly status: DeveloperProfileStatus;
  readonly engineeringScore: number | null;
  readonly deliveredHours: number;
  readonly recoveryHours: number;
  readonly capacityUtilization: number | null;
  readonly deliveryEfficiency: number | null;
  readonly trend: readonly number[];
}

export interface ExplorerTechnologyListItem {
  readonly id: string;
  readonly name: string;
  readonly status: TechnologyStatus;
  readonly statusLabel: string;
  readonly engineeringHealth: number | null;
  readonly engineeringValueDeliveredHours: number;
  readonly recoveryHours: number;
  readonly capacity: number | null;
  readonly deliveryEfficiency: number | null;
  readonly developers: number;
  readonly topContributors: readonly string[];
  readonly trend: readonly number[];
}

export interface ExplorerProjectListItem {
  readonly id: string;
  readonly projectKey: string;
  readonly issues: number;
  readonly stories: number;
  readonly engineeringHours: number;
  /** Not available from snapshot — always null until a project engine exists. */
  readonly engineeringScore: number | null;
  readonly trend: readonly number[];
  readonly source: "eaw" | "unavailable";
}

export interface ExplorerReadModel {
  readonly reportingPeriod: ReportingPeriod;
  readonly generatedAt: string | null;
  readonly syncStatus: SyncStatus;
  readonly overview: ExplorerOverview;
  readonly developers: readonly ExplorerDeveloperListItem[];
  readonly technologies: readonly ExplorerTechnologyListItem[];
  readonly projects: readonly ExplorerProjectListItem[];
  readonly searchIndex: readonly ExplorerSearchIndexEntry[];
  readonly meta: {
    readonly snapshotAvailable: boolean;
    readonly warehouseAvailable: boolean;
    readonly limitations: readonly string[];
  };
}

export interface ExplorerDeveloperDetail {
  readonly id: string;
  readonly developer: ExplorerDeveloperListItem;
  readonly scoreComponents: {
    readonly execution: number | null;
    readonly quality: number | null;
    readonly contribution: number | null;
  };
  readonly completedTasks: number;
  readonly reportingPeriod: ReportingPeriod;
  readonly generatedAt: string | null;
  readonly meta: { readonly limitations: readonly string[] };
}

export interface ExplorerTechnologyDetail {
  readonly id: string;
  readonly technology: ExplorerTechnologyListItem;
  readonly developers: readonly ExplorerDeveloperListItem[];
  readonly reportingPeriod: ReportingPeriod;
  readonly generatedAt: string | null;
  readonly meta: { readonly limitations: readonly string[] };
}

export interface ExplorerProjectIssueRow {
  readonly issueKey: string;
  readonly summary: string;
  readonly technology: string;
  readonly status: string;
  readonly issueType: string;
  readonly month: string;
}

export interface ExplorerProjectDetail {
  readonly id: string;
  readonly project: ExplorerProjectListItem;
  readonly issues: readonly ExplorerProjectIssueRow[];
  readonly technologies: readonly string[];
  readonly reportingPeriod: ReportingPeriod | null;
  readonly generatedAt: string | null;
  readonly meta: { readonly limitations: readonly string[] };
}
