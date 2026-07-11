/**
 * Technology Aggregation Engine — type definitions.
 *
 * Sprint 3C Milestone 9 aggregates Developer Profiles into Technology Profiles.
 */

import type { DeveloperProfile } from "@/services/developer-profile";

/** Canonical technology disciplines in TeamPulse. */
export type TechnologyName = "Magento" | "React JS" | "HTML" | "DT";

/**
 * Ordered list of technologies that always receive a profile,
 * even when no developers are present.
 */
export const TECHNOLOGY_NAMES: readonly TechnologyName[] = [
  "Magento",
  "React JS",
  "HTML",
  "DT",
] as const;

/**
 * Technology health status bands.
 *
 * | Score        | Status   |
 * |--------------|----------|
 * | ≥ 90         | Healthy  |
 * | 75 – 89.99   | Stable   |
 * | 60 – 74.99   | Monitor  |
 * | < 60         | Critical |
 * | null         | No Data  |
 */
export type TechnologyStatus =
  | "Healthy"
  | "Stable"
  | "Monitor"
  | "Critical"
  | "No Data";

/**
 * Aggregated technology object used throughout TeamPulse.
 *
 * Derived from Developer Profiles for a single technology discipline.
 * Recovery is informational and does not affect engineeringHealth.
 */
export interface TechnologyProfile {
  /** Technology discipline name. */
  technology: TechnologyName;
  /**
   * Total developers mapped to this technology in Team Mapping.
   * Source of truth is TEAM_MAPPING — not the aggregated profile count.
   */
  developerCount: number;
  /**
   * Weighted Engineering Score (weight = Delivered Engineering Hours).
   * Null when no developers contribute positive engineering value.
   */
  engineeringHealth: number | null;
  /**
   * Weighted Execution Efficiency (weight = Delivered Engineering Hours).
   * Null when no resolved execution scores have positive weight.
   */
  execution: number | null;
  /**
   * Weighted Delivery Quality (weight = Delivered Engineering Hours).
   * Null when no resolved quality scores have positive weight.
   */
  quality: number | null;
  /**
   * Sum of Delivered Engineering Hours across developers.
   * Never Story Count or Worklog Hours.
   */
  engineeringValueDeliveredHours: number;
  /** Sum of developer Recovery Hours for this technology. */
  recoveryHours: number;
  /**
   * Share of total recovery across all technologies:
   * (technologyRecoveryHours / totalRecoveryHours) × 100.
   * Zero when total recovery is zero.
   */
  recoveryPercentage: number;
  /** Status derived from engineeringHealth bands. */
  status: TechnologyStatus;
  /**
   * Dense rank among technologies (1 = healthiest).
   * Null until ranking is applied.
   */
  rank: number | null;
}

/** A value/weight pair for weighted-average calculation. */
export interface WeightedValue {
  value: number;
  weight: number;
}

/** Inputs for building technology profiles from developer profiles. */
export type BuildTechnologyProfilesInput = readonly DeveloperProfile[];
