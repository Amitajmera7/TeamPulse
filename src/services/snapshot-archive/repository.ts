import type { AnalyticsSnapshot } from "@/services/snapshot";

import { PostgresAnalyticsSnapshotRepository } from "./postgres";

const repository = new PostgresAnalyticsSnapshotRepository();

export function saveAnalyticsSnapshot(
  batchId: string,
  snapshot: AnalyticsSnapshot
) {
  return repository.save(batchId, snapshot);
}

export function getLatestAnalyticsSnapshot() {
  return repository.getLatest();
}