import type { DeveloperProfile } from "@/services/developer-profile";
import { TEAM_MAPPING } from "@/config/team-mapping";

import { assignTechnologyDenseRanks } from "./ranking";
import { resolveTechnologyStatus } from "./status";
import {
  TECHNOLOGY_NAMES,
  type TechnologyName,
  type TechnologyProfile,
  type WeightedValue,
} from "./types";
import { weightedAverage } from "./weighted-average";

/**
 * Returns the mapped developer count for a technology from Team Mapping.
 *
 * Team Mapping is the source of truth — not the aggregated profile count.
 */
export function getMappedDeveloperCount(technology: TechnologyName): number {
  return TEAM_MAPPING[technology].length;
}

/**
 * Returns Delivered Engineering Hours for a developer profile.
 * This is Engineering Value Delivered — never worklog hours or story count.
 */
export function getDeliveredEngineeringHours(
  profile: DeveloperProfile
): number {
  return profile.evaluation.contribution.deliveredEngineeringHours;
}

/**
 * Returns Recovery Hours for a developer profile.
 */
export function getRecoveryHours(profile: DeveloperProfile): number {
  return profile.evaluation.recovery.totalRecoveryHours;
}

/**
 * Groups developer profiles by canonical technology name.
 * Profiles with unmapped / unknown technology are excluded from technology buckets.
 */
export function groupProfilesByTechnology(
  profiles: readonly DeveloperProfile[]
): Record<TechnologyName, DeveloperProfile[]> {
  const groups: Record<TechnologyName, DeveloperProfile[]> = {
    Magento: [],
    "React JS": [],
    HTML: [],
    DT: [],
  };

  for (const profile of profiles) {
    const technology = profile.evaluation.technology;

    if (technology in groups) {
      groups[technology as TechnologyName].push(profile);
    }
  }

  return groups;
}

/**
 * Sums Delivered Engineering Hours across profiles.
 */
export function sumEngineeringValueDelivered(
  profiles: readonly DeveloperProfile[]
): number {
  return profiles.reduce(
    (total, profile) => total + getDeliveredEngineeringHours(profile),
    0
  );
}

/**
 * Sums Recovery Hours across profiles.
 */
export function sumRecoveryHours(
  profiles: readonly DeveloperProfile[]
): number {
  return profiles.reduce(
    (total, profile) => total + getRecoveryHours(profile),
    0
  );
}

/**
 * Recovery Percentage for a technology:
 *   (technologyRecoveryHours / totalRecoveryHours) × 100
 *
 * Returns 0 when total recovery is zero.
 */
export function calculateRecoveryPercentage(
  technologyRecoveryHours: number,
  totalRecoveryHours: number
): number {
  if (totalRecoveryHours <= 0) {
    return 0;
  }

  return (technologyRecoveryHours / totalRecoveryHours) * 100;
}

/**
 * Builds weighted-average entries for Engineering Health.
 * Skips developers with null Engineering Score (missing data ≠ zero).
 * Weight = Delivered Engineering Hours.
 */
export function collectHealthEntries(
  profiles: readonly DeveloperProfile[]
): WeightedValue[] {
  const entries: WeightedValue[] = [];

  for (const profile of profiles) {
    if (profile.engineeringScore === null) {
      continue;
    }

    entries.push({
      value: profile.engineeringScore,
      weight: getDeliveredEngineeringHours(profile),
    });
  }

  return entries;
}

/**
 * Builds weighted-average entries for Execution Efficiency.
 * Skips unresolved execution results. Weight = Delivered Engineering Hours.
 */
export function collectExecutionEntries(
  profiles: readonly DeveloperProfile[]
): WeightedValue[] {
  const entries: WeightedValue[] = [];

  for (const profile of profiles) {
    if (!profile.evaluation.execution.resolved) {
      continue;
    }

    entries.push({
      value: profile.evaluation.execution.efficiencyScore,
      weight: getDeliveredEngineeringHours(profile),
    });
  }

  return entries;
}

/**
 * Builds weighted-average entries for Delivery Quality.
 * Skips unresolved quality results. Weight = Delivered Engineering Hours.
 */
export function collectQualityEntries(
  profiles: readonly DeveloperProfile[]
): WeightedValue[] {
  const entries: WeightedValue[] = [];

  for (const profile of profiles) {
    if (!profile.evaluation.quality.resolved) {
      continue;
    }

    entries.push({
      value: profile.evaluation.quality.qualityScore,
      weight: getDeliveredEngineeringHours(profile),
    });
  }

  return entries;
}

/**
 * Assembles a single {@link TechnologyProfile} from developer profiles
 * belonging to one technology. Rank defaults to null.
 *
 * @param technology - Canonical technology name
 * @param profiles - Developer profiles mapped to this technology
 * @param totalRecoveryHours - Recovery hours across all technologies (denominator)
 */
export function buildTechnologyProfile(
  technology: TechnologyName,
  profiles: readonly DeveloperProfile[],
  totalRecoveryHours: number
): TechnologyProfile {
  const engineeringValueDeliveredHours =
    sumEngineeringValueDelivered(profiles);
  const recoveryHours = sumRecoveryHours(profiles);
  const engineeringHealth = weightedAverage(collectHealthEntries(profiles));
  const execution = weightedAverage(collectExecutionEntries(profiles));
  const quality = weightedAverage(collectQualityEntries(profiles));

  return {
    technology,
    developerCount: getMappedDeveloperCount(technology),
    engineeringHealth,
    execution,
    quality,
    engineeringValueDeliveredHours,
    recoveryHours,
    recoveryPercentage: calculateRecoveryPercentage(
      recoveryHours,
      totalRecoveryHours
    ),
    status: resolveTechnologyStatus(engineeringHealth),
    rank: null,
  };
}

/**
 * Aggregates Developer Profiles into Technology Profiles.
 *
 * Pipeline:
 * 1. Group profiles by technology (Magento, React JS, HTML, DT).
 * 2. Always emit one profile per technology (empty groups included).
 * 3. Compute weighted health / execution / quality (weight = delivered hours).
 * 4. Sum engineering value delivered and recovery hours.
 * 5. Compute recovery percentage against all-technology total.
 * 6. Assign dense ranks (health DESC, value DESC).
 *
 * Does not modify Developer Profiles, metric engines, or dashboard UI.
 */
export function buildTechnologyProfiles(
  profiles: readonly DeveloperProfile[]
): TechnologyProfile[] {
  const groups = groupProfilesByTechnology(profiles);
  const totalRecoveryHours = sumRecoveryHours(profiles);

  const technologyProfiles = TECHNOLOGY_NAMES.map((technology) =>
    buildTechnologyProfile(technology, groups[technology], totalRecoveryHours)
  );

  return assignTechnologyDenseRanks(technologyProfiles);
}
