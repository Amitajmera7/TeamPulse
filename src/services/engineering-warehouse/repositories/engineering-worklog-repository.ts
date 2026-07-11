/**
 * EngineeringWorklogRepository — persistence contract for worklog facts.
 *
 * Milestone 12A: interface only. No PostgreSQL / ORM / SQL.
 */

import type { EngineeringWorklog } from "../entities/engineering-worklog";
import type { BatchId, DateRange } from "../types";

/**
 * Repository contract for {@link EngineeringWorklog} facts.
 */
export interface EngineeringWorklogRepository {
  /**
   * Persists worklogs for a sync batch (saveBatch).
   * All rows must share the given BatchId.
   */
  saveBatch(
    batchId: BatchId,
    worklogs: readonly EngineeringWorklog[]
  ): Promise<void>;

  /** Persists many worklog rows (saveMany). */
  saveMany(worklogs: readonly EngineeringWorklog[]): Promise<void>;

  /** Returns worklogs for a batch (findByBatch). */
  findByBatch(batchId: BatchId): Promise<readonly EngineeringWorklog[]>;

  /** Returns worklogs for an issue key (findByIssue). */
  findByIssue(issueKey: string): Promise<readonly EngineeringWorklog[]>;

  /** Returns worklogs for a developer (findByDeveloper). */
  findByDeveloper(developer: string): Promise<readonly EngineeringWorklog[]>;

  /** Returns worklogs whose started timestamp falls in the range (findByDateRange). */
  findByDateRange(range: DateRange): Promise<readonly EngineeringWorklog[]>;
}
