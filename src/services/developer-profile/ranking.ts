import type { DeveloperProfile } from "./types";

/**
 * Assigns dense ranks to developer profiles by Engineering Score.
 *
 * Dense ranking: equal scores share a rank; the next distinct score
 * receives the next consecutive integer (no gaps).
 *
 * Example: scores 95, 95, 92 → ranks 1, 1, 2
 *
 * Profiles with `engineeringScore === null` (No Data) receive `rank: null`
 * and are placed after scored profiles without participating in ranking.
 *
 * Returns new profile objects — does not mutate inputs.
 */
export function assignDenseRanks(
  profiles: readonly DeveloperProfile[]
): DeveloperProfile[] {
  const scored: DeveloperProfile[] = [];
  const unscored: DeveloperProfile[] = [];

  for (const profile of profiles) {
    if (profile.engineeringScore === null) {
      unscored.push({ ...profile, rank: null });
    } else {
      scored.push(profile);
    }
  }

  const ordered = [...scored].sort((a, b) => {
    const scoreDiff = (b.engineeringScore as number) - (a.engineeringScore as number);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    return a.evaluation.developer.localeCompare(b.evaluation.developer);
  });

  const ranked: DeveloperProfile[] = [];
  let currentRank = 0;
  let previousScore: number | null = null;

  for (const profile of ordered) {
    const score = profile.engineeringScore as number;

    if (previousScore === null || score !== previousScore) {
      currentRank += 1;
      previousScore = score;
    }

    ranked.push({
      ...profile,
      rank: currentRank,
    });
  }

  return [...ranked, ...unscored];
}
