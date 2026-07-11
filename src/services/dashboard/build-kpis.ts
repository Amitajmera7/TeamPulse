/**
 * Dashboard Aggregator V2 — KPI builders from Analytics Snapshot.
 *
 * Sprint 3D Milestone 10B. Pure mapping — no analytics engine recalculation.
 */

import type { DeveloperProfile } from "@/services/developer-profile";
import { weightedAverage } from "@/services/technology-profile";
import type { MetricStatus } from "@/types/dashboard";

import type { DashboardKpiData } from "./types";
import { statusFromPercent } from "./utils";

/**
 * Weighted average of Engineering Scores.
 *
 * Weight = Engineering Value Delivered (Delivered Engineering Hours).
 * Missing Engineering Scores are excluded (never treated as zero).
 * Entries with weight ≤ 0 do not contribute.
 */
export function weightedAverageEngineeringScore(
  profiles: readonly DeveloperProfile[]
): number | null {
  return weightedAverage(
    profiles
      .filter((profile) => profile.engineeringScore !== null)
      .map((profile) => ({
        value: profile.engineeringScore as number,
        weight: profile.evaluation.contribution.deliveredEngineeringHours,
      }))
  );
}

/**
 * Sum of Delivered Engineering Hours across developer profiles.
 */
export function sumEngineeringValueDeliveredHours(
  profiles: readonly DeveloperProfile[]
): number {
  return profiles.reduce(
    (total, profile) =>
      total + profile.evaluation.contribution.deliveredEngineeringHours,
    0
  );
}

/**
 * Weighted average Delivery Quality.
 * Weight = Engineering Value Delivered (Delivered Engineering Hours).
 * Unresolved quality results are ignored.
 */
export function weightedAverageQuality(
  profiles: readonly DeveloperProfile[]
): number | null {
  return weightedAverage(
    profiles
      .filter((profile) => profile.evaluation.quality.resolved)
      .map((profile) => ({
        value: profile.evaluation.quality.qualityScore,
        weight: profile.evaluation.contribution.deliveredEngineeringHours,
      }))
  );
}

/**
 * Sum of Recovery Hours across developer profiles.
 */
export function sumRecoveryHours(
  profiles: readonly DeveloperProfile[]
): number {
  return profiles.reduce(
    (total, profile) => total + profile.evaluation.recovery.totalRecoveryHours,
    0
  );
}

function formatScore(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatHours(value: number): string {
  if (Number.isInteger(value)) {
    return `${value}h`;
  }

  return `${value.toFixed(1)}h`;
}

function recoveryStatus(hours: number): {
  status: MetricStatus;
  statusLabel: string;
} {
  if (hours <= 0) {
    return { status: "healthy", statusLabel: "None" };
  }

  if (hours < 20) {
    return { status: "on-track", statusLabel: "Low" };
  }

  if (hours < 40) {
    return { status: "neutral", statusLabel: "Moderate" };
  }

  return { status: "attention", statusLabel: "Elevated" };
}

/**
 * Builds the four dashboard KPI cards from developer profiles.
 *
 * KPI semantics (Milestone 10B):
 * 1. Engineering Health — weighted average Engineering Score
 *    (weight = Delivered Engineering Hours)
 * 2. Engineering Value Delivered — sum of delivered hours
 * 3. Quality — weighted average quality (weight = delivered hours)
 * 4. Recovery — total recovery hours
 *
 * Existing KPI `id` values are preserved so React icon maps remain valid
 * without modifying dashboard UI components.
 *
 * Each KPI includes `generatedAt` from the Analytics Snapshot.
 */
export function buildKpisFromSnapshot(input: {
  developerProfiles: readonly DeveloperProfile[];
  generatedAt: string;
}): DashboardKpiData[] {
  const { developerProfiles, generatedAt } = input;

  const engineeringHealth = weightedAverageEngineeringScore(developerProfiles);
  const engineeringValue = sumEngineeringValueDeliveredHours(developerProfiles);
  const quality = weightedAverageQuality(developerProfiles);
  const recoveryHours = sumRecoveryHours(developerProfiles);

  const healthStatus =
    engineeringHealth === null
      ? { status: "neutral" as const, label: "No Data" }
      : statusFromPercent(engineeringHealth);

  const qualityStatus =
    quality === null
      ? { status: "neutral" as const, label: "No Data" }
      : statusFromPercent(quality);

  const recovery = recoveryStatus(recoveryHours);

  return [
    {
      id: "delivery-health",
      title: "Engineering Health",
      value:
        engineeringHealth === null
          ? "—"
          : `${formatScore(engineeringHealth)}`,
      status: healthStatus.status,
      statusLabel: healthStatus.label,
      trend: "neutral",
      trendLabel: "Snapshot",
      chartColor: "var(--chart-1)",
      sparkline: engineeringHealth === null ? [] : [engineeringHealth],
      generatedAt,
    },
    {
      id: "productivity",
      title: "Engineering Value Delivered",
      value: formatHours(engineeringValue),
      status: engineeringValue > 0 ? "on-track" : "neutral",
      statusLabel: engineeringValue > 0 ? "Delivered" : "No Data",
      trend: "neutral",
      trendLabel: "Snapshot",
      chartColor: "var(--chart-2)",
      sparkline: [],
      generatedAt,
    },
    {
      id: "utilization",
      title: "Quality",
      value: quality === null ? "—" : formatScore(quality),
      status: qualityStatus.status,
      statusLabel: qualityStatus.label,
      trend: "neutral",
      trendLabel: "Snapshot",
      chartColor: "var(--chart-3)",
      sparkline: quality === null ? [] : [quality],
      generatedAt,
    },
    {
      id: "risk",
      title: "Recovery",
      value: formatHours(recoveryHours),
      status: recovery.status,
      statusLabel: recovery.statusLabel,
      trend: "neutral",
      trendLabel: "Snapshot",
      chartColor: "var(--destructive)",
      sparkline: [],
      valueClassName: recoveryHours > 0 ? "text-destructive" : undefined,
      generatedAt,
    },
  ];
}
