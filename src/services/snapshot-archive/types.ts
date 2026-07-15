import type { AnalyticsSnapshot } from "@/services/snapshot";

export interface StoredAnalyticsSnapshot {
  batchId: string;
  generatedAt: string;
  reportingMonth: string;
  version: string;
  snapshot: AnalyticsSnapshot;
}