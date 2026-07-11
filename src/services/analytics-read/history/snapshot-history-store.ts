/**
 * In-memory archive of slim snapshot projections (newest first).
 * Dedupes by reportingPeriod.month. Cap covers 12-month history + buffer.
 */

import type { SnapshotHistoryEntry } from "./types";

const MAX_ENTRIES = 24;

let snapshotHistory: SnapshotHistoryEntry[] = [];

/**
 * Pushes a period projection onto the archive (dedupe by month).
 */
export function pushSnapshotHistoryEntry(entry: SnapshotHistoryEntry): void {
  const withoutDup = snapshotHistory.filter(
    (existing) =>
      existing.reportingPeriod.month !== entry.reportingPeriod.month
  );

  snapshotHistory = [entry, ...withoutDup].slice(0, MAX_ENTRIES);
}

/**
 * Returns archived projections newest-first (copied).
 */
export function getSnapshotHistoryEntries(): readonly SnapshotHistoryEntry[] {
  return snapshotHistory.map((entry) => ({
    ...entry,
    technologies: [...entry.technologies],
    developers: [...entry.developers],
  }));
}

/**
 * Clears archive (tests).
 */
export function clearSnapshotHistoryForTests(): void {
  snapshotHistory = [];
}

/**
 * Archive size for API meta.
 */
export function getSnapshotHistoryCount(): number {
  return snapshotHistory.length;
}
