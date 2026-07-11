/**
 * Dashboard Aggregator V2 — contributor leaderboard from Developer Profiles.
 *
 * Sprint 3D Milestone 10B.
 */

import type { DeveloperProfile } from "@/services/developer-profile";

import type { ContributorRow } from "./types";
import { getInitials } from "./utils";

const DEFAULT_CONTRIBUTOR_LIMIT = 10;

/**
 * Sort key for contributor ranking:
 * 1. Engineering Score DESC (nulls last)
 * 2. Engineering Value Delivered DESC
 * 3. Developer Name ASC
 */
export function compareDeveloperProfilesForContributors(
  a: DeveloperProfile,
  b: DeveloperProfile
): number {
  const aScore = a.engineeringScore;
  const bScore = b.engineeringScore;

  if (aScore === null && bScore === null) {
    // fall through
  } else if (aScore === null) {
    return 1;
  } else if (bScore === null) {
    return -1;
  } else if (aScore !== bScore) {
    return bScore - aScore;
  }

  const aValue = a.evaluation.contribution.deliveredEngineeringHours;
  const bValue = b.evaluation.contribution.deliveredEngineeringHours;

  if (aValue !== bValue) {
    return bValue - aValue;
  }

  return a.evaluation.developer.localeCompare(b.evaluation.developer);
}

/**
 * Maps a Developer Profile to a ContributorRow presentation model.
 */
export function mapDeveloperProfileToContributor(
  profile: DeveloperProfile
): Omit<ContributorRow, "storiesMax" | "hoursMax"> {
  const deliveredHours =
    profile.evaluation.contribution.deliveredEngineeringHours;

  return {
    name: profile.evaluation.developer,
    initials: getInitials(profile.evaluation.developer),
    stories: profile.evaluation.contribution.completedTasks,
    hours: Math.round(deliveredHours),
    efficiency: Math.round(profile.engineeringScore ?? 0),
  };
}

/**
 * Builds the Top Contributors table from Developer Profiles.
 *
 * Sort: Engineering Score DESC → Engineering Value Delivered DESC → Name ASC.
 * Returns at most `limit` rows (default 10). Returns fewer when fewer exist.
 */
export function buildContributorsFromProfiles(
  profiles: readonly DeveloperProfile[],
  limit: number = DEFAULT_CONTRIBUTOR_LIMIT
): ContributorRow[] {
  const sorted = [...profiles]
    .sort(compareDeveloperProfilesForContributors)
    .slice(0, Math.max(0, limit))
    .map(mapDeveloperProfileToContributor);

  const storiesMax = Math.max(...sorted.map((row) => row.stories), 1);
  const hoursMax = Math.max(...sorted.map((row) => row.hours), 1);

  return sorted.map((row) => ({
    ...row,
    storiesMax,
    hoursMax,
  }));
}
