/**
 * PostgreSQL implementation of EngineeringIssueRepository.
 *
 * Milestone 13A — persistence only; no analytics logic.
 */

import type { EngineeringIssue } from "../../entities/engineering-issue";
import type { EngineeringIssueRepository } from "../../repositories/engineering-issue-repository";
import type { BatchId, DateRange } from "../../types";
import { getWarehouseQueryable } from "../connection";
import type { Queryable } from "../queryable";
import {
  mapEngineeringIssueRow,
  type EngineeringIssueRow,
} from "../mappers";

const UPSERT_ISSUE = `
  INSERT INTO engineering_issue (
    batch_id,
    issue_key,
    issue_id,
    project_key,
    issue_type,
    technology,
    summary,
    status,
    issue_status_category,
    created_at,
    resolved_at,
    parent_issue,
    sprint,
    month
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  ON CONFLICT (batch_id, issue_key) DO UPDATE SET
    issue_id = EXCLUDED.issue_id,
    project_key = EXCLUDED.project_key,
    issue_type = EXCLUDED.issue_type,
    technology = EXCLUDED.technology,
    summary = EXCLUDED.summary,
    status = EXCLUDED.status,
    issue_status_category = EXCLUDED.issue_status_category,
    created_at = EXCLUDED.created_at,
    resolved_at = EXCLUDED.resolved_at,
    parent_issue = EXCLUDED.parent_issue,
    sprint = EXCLUDED.sprint,
    month = EXCLUDED.month
`;

export class PostgresEngineeringIssueRepository
  implements EngineeringIssueRepository
{
  constructor(private readonly db: Queryable = getWarehouseQueryable()) {}

  async saveBatch(
    batchId: BatchId,
    issues: readonly EngineeringIssue[]
  ): Promise<void> {
    for (const issue of issues) {
      if (issue.batchId !== batchId) {
        throw new Error(
          `EngineeringIssue batchId mismatch: expected ${batchId}, got ${issue.batchId}`
        );
      }
      await this.upsertIssue(issue);
    }
  }

  async saveMany(issues: readonly EngineeringIssue[]): Promise<void> {
    for (const issue of issues) {
      await this.upsertIssue(issue);
    }
  }

  private async upsertIssue(issue: EngineeringIssue): Promise<void> {
    await this.db.query(UPSERT_ISSUE, [
      issue.batchId,
      issue.issueKey,
      issue.issueId,
      issue.projectKey,
      issue.issueType,
      issue.technology,
      issue.summary,
      issue.status,
      issue.issueStatusCategory,
      issue.created,
      issue.resolved,
      issue.parentIssue,
      issue.sprint,
      issue.month,
    ]);
  }

  async findByBatch(batchId: BatchId): Promise<readonly EngineeringIssue[]> {
    const result = await this.db.query<EngineeringIssueRow>(
      `SELECT * FROM engineering_issue WHERE batch_id = $1 ORDER BY issue_key`,
      [batchId]
    );

    return result.rows.map(mapEngineeringIssueRow);
  }

  async findByIssue(issueKey: string): Promise<readonly EngineeringIssue[]> {
    const result = await this.db.query<EngineeringIssueRow>(
      `SELECT * FROM engineering_issue
       WHERE issue_key = $1
       ORDER BY created_at DESC`,
      [issueKey]
    );

    return result.rows.map(mapEngineeringIssueRow);
  }

  async findByDeveloper(
    developer: string
  ): Promise<readonly EngineeringIssue[]> {
    const result = await this.db.query<EngineeringIssueRow>(
      `SELECT DISTINCT ei.*
       FROM engineering_issue ei
       INNER JOIN engineering_allocation ea
         ON ea.batch_id = ei.batch_id AND ea.issue_key = ei.issue_key
       WHERE ea.developer = $1
       ORDER BY ei.created_at DESC`,
      [developer]
    );

    return result.rows.map(mapEngineeringIssueRow);
  }

  async findByDateRange(
    range: DateRange
  ): Promise<readonly EngineeringIssue[]> {
    const result = await this.db.query<EngineeringIssueRow>(
      `SELECT * FROM engineering_issue
       WHERE created_at >= $1::timestamptz
         AND created_at <= $2::timestamptz
       ORDER BY created_at DESC`,
      [range.from, range.to]
    );

    return result.rows.map(mapEngineeringIssueRow);
  }
}
