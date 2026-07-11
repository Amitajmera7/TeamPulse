/**
 * EngineeringAllocationRepository — persistence contract for allocation facts.
 *
 * Milestone 12A: interface only. No PostgreSQL / ORM / SQL.
 */

import type { EngineeringAllocation } from "../entities/engineering-allocation";
import type { BatchId, DateRange } from "../types";

/**
 * Repository contract for {@link EngineeringAllocation} facts.
 */
export interface EngineeringAllocationRepository {
  /**
   * Persists allocations for a sync batch (saveBatch).
   * All rows must share the given BatchId.
   */
  saveBatch(
    batchId: BatchId,
    allocations: readonly EngineeringAllocation[]
  ): Promise<void>;

  /** Persists many allocation rows (saveMany). */
  saveMany(allocations: readonly EngineeringAllocation[]): Promise<void>;

  /** Returns allocations for a batch (findByBatch). */
  findByBatch(batchId: BatchId): Promise<readonly EngineeringAllocation[]>;

  /** Returns allocations for an issue key (findByIssue). */
  findByIssue(issueKey: string): Promise<readonly EngineeringAllocation[]>;

  /** Returns allocations for a developer (findByDeveloper). */
  findByDeveloper(
    developer: string
  ): Promise<readonly EngineeringAllocation[]>;

  /**
   * Returns allocations belonging to batches whose startedAt falls in the range
   * (findByDateRange). Date filtering is via SyncBatch in a future store.
   */
  findByDateRange(range: DateRange): Promise<readonly EngineeringAllocation[]>;
}
