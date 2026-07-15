import {
    getLatestCompletedSnapshot,
    setLatestCompletedSnapshot,
    type AnalyticsSnapshot,
  } from "@/services/snapshot";
  
  import { getLatestAnalyticsSnapshot } from "@/services/snapshot-archive";
  
  export interface SnapshotRecoveryResult {
    recovered: boolean;
    source: "memory" | "postgres" | "none";
    snapshot: AnalyticsSnapshot | null;
  }
  
  /**
   * Ensures the latest completed snapshot is available in memory.
   *
   * Priority:
   * 1. Existing memory cache
   * 2. PostgreSQL
   * 3. No snapshot
   */
  export async function recoverLatestSnapshot(): Promise<SnapshotRecoveryResult> {
    // Already cached
    const cached = getLatestCompletedSnapshot();
  
    if (cached) {
      return {
        recovered: false,
        source: "memory",
        snapshot: cached,
      };
    }
  
    // Load latest persisted snapshot
    const stored = await getLatestAnalyticsSnapshot();
  
    if (!stored) {
      return {
        recovered: false,
        source: "none",
        snapshot: null,
      };
    }
  
    setLatestCompletedSnapshot(stored.snapshot);
  
    return {
      recovered: true,
      source: "postgres",
      snapshot: stored.snapshot,
    };
  }