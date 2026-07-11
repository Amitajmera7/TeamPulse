/**
 * PostgreSQL implementation of SyncBatchRepository.
 *
 * Milestone 13A — persistence only; no analytics logic.
 */

import type { SyncBatch } from "../../entities/sync-batch";
import type { SyncBatchRepository } from "../../repositories/sync-batch-repository";
import type { BatchId, DateRange } from "../../types";
import { getWarehouseQueryable } from "../connection";
import type { Queryable } from "../queryable";
import { mapSyncBatchRow, type SyncBatchRow } from "../mappers";

const UPSERT_SYNC_BATCH = `
  INSERT INTO sync_batch (
    batch_id,
    started_at,
    completed_at,
    duration_ms,
    status,
    issues_processed,
    worklogs_processed,
    warehouse_schema_version
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  ON CONFLICT (batch_id) DO UPDATE SET
    started_at = EXCLUDED.started_at,
    completed_at = EXCLUDED.completed_at,
    duration_ms = EXCLUDED.duration_ms,
    status = EXCLUDED.status,
    issues_processed = EXCLUDED.issues_processed,
    worklogs_processed = EXCLUDED.worklogs_processed,
    warehouse_schema_version = EXCLUDED.warehouse_schema_version
`;

export class PostgresSyncBatchRepository implements SyncBatchRepository {
  constructor(private readonly db: Queryable = getWarehouseQueryable()) {}

  async saveBatch(batch: SyncBatch): Promise<void> {
    await this.db.query(UPSERT_SYNC_BATCH, [
      batch.batchId,
      batch.startedAt,
      batch.completedAt,
      batch.durationMs,
      batch.status,
      batch.issuesProcessed,
      batch.worklogsProcessed,
      batch.warehouseSchemaVersion,
    ]);
  }

  async saveMany(batches: readonly SyncBatch[]): Promise<void> {
    for (const batch of batches) {
      await this.saveBatch(batch);
    }
  }

  async findByBatch(batchId: BatchId): Promise<SyncBatch | null> {
    const result = await this.db.query<SyncBatchRow>(
      `SELECT * FROM sync_batch WHERE batch_id = $1`,
      [batchId]
    );

    const row = result.rows[0];
    return row ? mapSyncBatchRow(row) : null;
  }

  async findByIssue(issueKey: string): Promise<readonly SyncBatch[]> {
    const result = await this.db.query<SyncBatchRow>(
      `SELECT DISTINCT sb.*
       FROM sync_batch sb
       INNER JOIN engineering_issue ei ON ei.batch_id = sb.batch_id
       WHERE ei.issue_key = $1
       ORDER BY sb.started_at DESC`,
      [issueKey]
    );

    return result.rows.map(mapSyncBatchRow);
  }

  async findByDeveloper(developer: string): Promise<readonly SyncBatch[]> {
    const result = await this.db.query<SyncBatchRow>(
      `SELECT DISTINCT sb.*
       FROM sync_batch sb
       WHERE EXISTS (
         SELECT 1 FROM engineering_allocation ea
         WHERE ea.batch_id = sb.batch_id AND ea.developer = $1
       )
       OR EXISTS (
         SELECT 1 FROM engineering_worklog ew
         WHERE ew.batch_id = sb.batch_id AND ew.developer = $1
       )
       ORDER BY sb.started_at DESC`,
      [developer]
    );

    return result.rows.map(mapSyncBatchRow);
  }

  async findByDateRange(range: DateRange): Promise<readonly SyncBatch[]> {
    const result = await this.db.query<SyncBatchRow>(
      `SELECT * FROM sync_batch
       WHERE started_at >= $1::timestamptz
         AND started_at <= $2::timestamptz
       ORDER BY started_at DESC`,
      [range.from, range.to]
    );

    return result.rows.map(mapSyncBatchRow);
  }

  async findRecent(
    limit: number,
    offset: number = 0
  ): Promise<readonly SyncBatch[]> {
    const safeLimit = Math.max(0, Math.min(Math.floor(limit), 500));
    const safeOffset = Math.max(0, Math.floor(offset));

    const result = await this.db.query<SyncBatchRow>(
      `SELECT * FROM sync_batch
       ORDER BY started_at DESC
       LIMIT $1 OFFSET $2`,
      [safeLimit, safeOffset]
    );

    return result.rows.map(mapSyncBatchRow);
  }
}
