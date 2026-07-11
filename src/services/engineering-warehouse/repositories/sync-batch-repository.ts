/**
 * SyncBatchRepository — persistence contract for sync batches.
 *
 * Milestone 12A: interface only. No PostgreSQL / ORM / SQL.
 */

import type { SyncBatch } from "../entities/sync-batch";
import type { BatchId, DateRange } from "../types";

/**
 * Repository contract for {@link SyncBatch} facts.
 *
 * Future PostgreSQL implementation will back these methods; Milestone 12A
 * defines the surface only.
 */
export interface SyncBatchRepository {
  /** Persists a single sync batch (saveBatch). */
  saveBatch(batch: SyncBatch): Promise<void>;

  /** Persists many sync batches (saveMany). */
  saveMany(batches: readonly SyncBatch[]): Promise<void>;

  /** Returns the batch with the given BatchId, or null (findByBatch). */
  findByBatch(batchId: BatchId): Promise<SyncBatch | null>;

  /**
   * Returns batches that ingested the given issue key (findByIssue).
   * Implementation may join through EngineeringIssue in a future store.
   */
  findByIssue(issueKey: string): Promise<readonly SyncBatch[]>;

  /**
   * Returns batches that ingested allocations/worklogs for the developer
   * (findByDeveloper).
   */
  findByDeveloper(developer: string): Promise<readonly SyncBatch[]>;

  /** Returns batches whose startedAt falls in the range (findByDateRange). */
  findByDateRange(range: DateRange): Promise<readonly SyncBatch[]>;

  /**
   * Returns the most recent batches ordered by startedAt DESC (findRecent).
   * Pagination-ready; does not change warehouse schema.
   */
  findRecent(limit: number, offset?: number): Promise<readonly SyncBatch[]>;
}
