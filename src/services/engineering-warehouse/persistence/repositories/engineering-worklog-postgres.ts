/**
 * PostgreSQL implementation of EngineeringWorklogRepository.
 *
 * Milestone 13A — persistence only; no analytics logic.
 * Idempotent UPSERT on (batch_id, worklog_key).
 */

import type { EngineeringWorklog } from "../../entities/engineering-worklog";
import type { EngineeringWorklogRepository } from "../../repositories/engineering-worklog-repository";
import type { BatchId, DateRange } from "../../types";
import { getWarehouseQueryable } from "../connection";
import type { Queryable } from "../queryable";
import {
  mapEngineeringWorklogRow,
  type EngineeringWorklogRow,
} from "../mappers";
import { buildEngineeringWorklogKey } from "../worklog-identity";

const UPSERT_WORKLOG = `
  INSERT INTO engineering_worklog (
    batch_id,
    worklog_key,
    jira_worklog_id,
    issue_key,
    developer,
    started_at,
    hours,
    author
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  ON CONFLICT (batch_id, worklog_key) DO UPDATE SET
    jira_worklog_id = EXCLUDED.jira_worklog_id,
    issue_key = EXCLUDED.issue_key,
    developer = EXCLUDED.developer,
    started_at = EXCLUDED.started_at,
    hours = EXCLUDED.hours,
    author = EXCLUDED.author
`;

const SELECT_WORKLOG_COLUMNS = `
  batch_id, worklog_key, jira_worklog_id, issue_key, developer, started_at, hours, author
`;

export class PostgresEngineeringWorklogRepository
  implements EngineeringWorklogRepository
{
  constructor(private readonly db: Queryable = getWarehouseQueryable()) {}

  async saveBatch(
    batchId: BatchId,
    worklogs: readonly EngineeringWorklog[]
  ): Promise<void> {
    for (const worklog of worklogs) {
      if (worklog.batchId !== batchId) {
        throw new Error(
          `EngineeringWorklog batchId mismatch: expected ${batchId}, got ${worklog.batchId}`
        );
      }
      await this.upsertWorklog(worklog);
    }
  }

  async saveMany(worklogs: readonly EngineeringWorklog[]): Promise<void> {
    for (const worklog of worklogs) {
      await this.upsertWorklog(worklog);
    }
  }

  private async upsertWorklog(worklog: EngineeringWorklog): Promise<void> {
    const worklogKey =
      worklog.worklogKey.trim() ||
      buildEngineeringWorklogKey({
        jiraWorklogId: worklog.jiraWorklogId,
        issueKey: worklog.issueKey,
        developer: worklog.developer,
        started: worklog.started,
        hours: worklog.hours,
        author: worklog.author,
      });

    await this.db.query(UPSERT_WORKLOG, [
      worklog.batchId,
      worklogKey,
      worklog.jiraWorklogId,
      worklog.issueKey,
      worklog.developer,
      worklog.started,
      worklog.hours,
      worklog.author,
    ]);
  }

  async findByBatch(
    batchId: BatchId
  ): Promise<readonly EngineeringWorklog[]> {
    const result = await this.db.query<EngineeringWorklogRow>(
      `SELECT ${SELECT_WORKLOG_COLUMNS}
       FROM engineering_worklog
       WHERE batch_id = $1
       ORDER BY started_at, issue_key`,
      [batchId]
    );

    return result.rows.map(mapEngineeringWorklogRow);
  }

  async findByIssue(
    issueKey: string
  ): Promise<readonly EngineeringWorklog[]> {
    const result = await this.db.query<EngineeringWorklogRow>(
      `SELECT ${SELECT_WORKLOG_COLUMNS}
       FROM engineering_worklog
       WHERE issue_key = $1
       ORDER BY started_at DESC`,
      [issueKey]
    );

    return result.rows.map(mapEngineeringWorklogRow);
  }

  async findByDeveloper(
    developer: string
  ): Promise<readonly EngineeringWorklog[]> {
    const result = await this.db.query<EngineeringWorklogRow>(
      `SELECT ${SELECT_WORKLOG_COLUMNS}
       FROM engineering_worklog
       WHERE developer = $1
       ORDER BY started_at DESC`,
      [developer]
    );

    return result.rows.map(mapEngineeringWorklogRow);
  }

  async findByDateRange(
    range: DateRange
  ): Promise<readonly EngineeringWorklog[]> {
    const result = await this.db.query<EngineeringWorklogRow>(
      `SELECT ${SELECT_WORKLOG_COLUMNS}
       FROM engineering_worklog
       WHERE started_at >= $1::timestamptz
         AND started_at <= $2::timestamptz
       ORDER BY started_at DESC`,
      [range.from, range.to]
    );

    return result.rows.map(mapEngineeringWorklogRow);
  }
}
