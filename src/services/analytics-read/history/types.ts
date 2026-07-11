/**
 * Slim historical projection of a completed Analytics Snapshot.
 *
 * Values are copied at publish time from already-built profiles/dashboard —
 * no formula recalculation at read time.
 */

import type { ReportingPeriod } from "@/services/dashboard/types";
import type { TechnologyName } from "@/services/technology-profile";

export interface SnapshotHistoryTechnologySlice {
  readonly technology: TechnologyName;
  readonly engineeringHealth: number | null;
  readonly execution: number | null;
  readonly engineeringValueDeliveredHours: number;
  readonly recoveryHours: number;
}

export interface SnapshotHistoryDeveloperSlice {
  readonly developer: string;
  readonly technology: string;
  readonly engineeringScore: number | null;
  readonly deliveredEngineeringHours: number;
  readonly recoveryHours: number;
  /** Precomputed contribution/capacity score from Engineering Score detail. */
  readonly capacityUtilization: number | null;
  readonly deliveryEfficiency: number | null;
}

/**
 * One archived period projection for Historical Engineering Analytics.
 */
export interface SnapshotHistoryEntry {
  readonly reportingPeriod: ReportingPeriod;
  readonly generatedAt: string;
  readonly engineeringScore: number | null;
  readonly engineeringValueDeliveredHours: number;
  readonly recoveryHours: number;
  /** Team-level capacity utilization from stored contribution components. */
  readonly capacityUtilization: number | null;
  /** Team-level delivery efficiency from stored execution scores. */
  readonly deliveryEfficiency: number | null;
  readonly technologies: readonly SnapshotHistoryTechnologySlice[];
  readonly developers: readonly SnapshotHistoryDeveloperSlice[];
}
