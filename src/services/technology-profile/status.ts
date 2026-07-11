/**
 * Technology Profile status resolution.
 *
 * Status bands (Milestone 9):
 * | Score        | Status   |
 * |--------------|----------|
 * | ≥ 90         | Healthy  |
 * | 75 – 89.99   | Stable   |
 * | 60 – 74.99   | Monitor  |
 * | < 60         | Critical |
 * | null         | No Data  |
 */

import type { TechnologyStatus } from "./types";

/** Status band thresholds for Technology Health. */
export const TECHNOLOGY_STATUS_THRESHOLDS = {
  healthy: 90,
  stable: 75,
  monitor: 60,
} as const;

/**
 * Maps Technology Health to a {@link TechnologyStatus} band.
 *
 * Pass `null` when no developers contribute engineering value —
 * resolves to "No Data".
 */
export function resolveTechnologyStatus(
  engineeringHealth: number | null
): TechnologyStatus {
  if (engineeringHealth === null) {
    return "No Data";
  }

  const { healthy, stable, monitor } = TECHNOLOGY_STATUS_THRESHOLDS;

  if (engineeringHealth >= healthy) {
    return "Healthy";
  }

  if (engineeringHealth >= stable) {
    return "Stable";
  }

  if (engineeringHealth >= monitor) {
    return "Monitor";
  }

  return "Critical";
}
