import type { WeightedValue } from "./types";

/**
 * Calculates a weighted average.
 *
 *   Σ (value × weight) / Σ weight
 *
 * Entries with weight ≤ 0 are ignored.
 * Returns null when no positive-weight entries remain
 * (missing data is never treated as zero).
 */
export function weightedAverage(
  entries: readonly WeightedValue[]
): number | null {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const entry of entries) {
    if (entry.weight <= 0) {
      continue;
    }

    weightedSum += entry.value * entry.weight;
    totalWeight += entry.weight;
  }

  if (totalWeight <= 0) {
    return null;
  }

  return weightedSum / totalWeight;
}
