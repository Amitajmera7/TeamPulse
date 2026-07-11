/**
 * EngineeringIssueRepository — persistence contract for issue facts.
 *
 * Milestone 12A: interface only. No PostgreSQL / ORM / SQL.
 */

import type { EngineeringIssue } from "../entities/engineering-issue";
import type { BatchId, DateRange } from "../types";

/**
 * Repository contract for {@link EngineeringIssue} facts.
 */
export interface EngineeringIssueRepository {
  /**
   * Associates / upserts issues under an existing sync batch context (saveBatch).
   * Callers pass the BatchId and the issue rows belonging to that batch.
   */
  saveBatch(
    batchId: BatchId,
    issues: readonly EngineeringIssue[]
  ): Promise<void>;

  /** Persists many issue rows (saveMany). */
  saveMany(issues: readonly EngineeringIssue[]): Promise<void>;

  /** Returns all issues ingested in a batch (findByBatch). */
  findByBatch(batchId: BatchId): Promise<readonly EngineeringIssue[]>;

  /** Returns issue rows for a Jira issue key across retained history (findByIssue). */
  findByIssue(issueKey: string): Promise<readonly EngineeringIssue[]>;

  /**
   * Returns issues linked to a developer via allocations in retained history
   * (findByDeveloper). May join allocations in a future store.
   */
  findByDeveloper(developer: string): Promise<readonly EngineeringIssue[]>;

  /** Returns issues whose created timestamp falls in the range (findByDateRange). */
  findByDateRange(range: DateRange): Promise<readonly EngineeringIssue[]>;
}
