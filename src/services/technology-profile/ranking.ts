import type { TechnologyProfile } from "./types";

/**
 * Ranking key for dense technology ranking.
 *
 * Primary: Technology Health DESC (nulls last)
 * Secondary: Engineering Value Delivered DESC
 */
function compareTechnologyProfiles(
  a: TechnologyProfile,
  b: TechnologyProfile
): number {
  const aHealth = a.engineeringHealth;
  const bHealth = b.engineeringHealth;

  if (aHealth === null && bHealth === null) {
    // fall through to value
  } else if (aHealth === null) {
    return 1;
  } else if (bHealth === null) {
    return -1;
  } else if (aHealth !== bHealth) {
    return bHealth - aHealth;
  }

  if (a.engineeringValueDeliveredHours !== b.engineeringValueDeliveredHours) {
    return b.engineeringValueDeliveredHours - a.engineeringValueDeliveredHours;
  }

  return a.technology.localeCompare(b.technology);
}

/**
 * Returns true when two profiles share the same ranking key
 * (health + engineering value delivered).
 */
function sameRankKey(a: TechnologyProfile, b: TechnologyProfile): boolean {
  return (
    a.engineeringHealth === b.engineeringHealth &&
    a.engineeringValueDeliveredHours === b.engineeringValueDeliveredHours
  );
}

/**
 * Assigns dense ranks to technology profiles.
 *
 * Sort order:
 * 1. Technology Health DESC (nulls last)
 * 2. Engineering Value Delivered DESC
 *
 * Dense ranking: equal keys share a rank; the next distinct key
 * receives the next consecutive integer (no gaps).
 *
 * Returns new profile objects — does not mutate inputs.
 */
export function assignTechnologyDenseRanks(
  profiles: readonly TechnologyProfile[]
): TechnologyProfile[] {
  const ordered = [...profiles].sort(compareTechnologyProfiles);

  const ranked: TechnologyProfile[] = [];
  let currentRank = 0;
  let previous: TechnologyProfile | null = null;

  for (const profile of ordered) {
    if (previous === null || !sameRankKey(previous, profile)) {
      currentRank += 1;
      previous = profile;
    }

    ranked.push({
      ...profile,
      rank: currentRank,
    });
  }

  return ranked;
}
