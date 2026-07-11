/**
 * PostgreSQL implementation of EngineeringAllocationRepository.
 *
 * Milestone 13A — persistence only; no analytics logic.
 */

import type { EngineeringAllocation } from "../../entities/engineering-allocation";
import type { EngineeringAllocationRepository } from "../../repositories/engineering-allocation-repository";
import type { BatchId, DateRange } from "../../types";
import { getWarehouseQueryable } from "../connection";
import type { Queryable } from "../queryable";
import {
  mapEngineeringAllocationRow,
  type EngineeringAllocationRow,
} from "../mappers";

const UPSERT_ALLOCATION = `
  INSERT INTO engineering_allocation (
    batch_id,
    issue_key,
    developer,
    technology,
    original_estimate_hours,
    resolved_estimate_hours,
    actual_hours,
    worklog_count
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  ON CONFLICT (batch_id, issue_key, developer) DO UPDATE SET
    technology = EXCLUDED.technology,
    original_estimate_hours = EXCLUDED.original_estimate_hours,
    resolved_estimate_hours = EXCLUDED.resolved_estimate_hours,
    actual_hours = EXCLUDED.actual_hours,
    worklog_count = EXCLUDED.worklog_count
`;

export class PostgresEngineeringAllocationRepository
  implements EngineeringAllocationRepository
{
  constructor(private readonly db: Queryable = getWarehouseQueryable()) {}

  async saveBatch(
    batchId: BatchId,
    allocations: readonly EngineeringAllocation[]
  ): Promise<void> {
    for (const allocation of allocations) {
      if (allocation.batchId !== batchId) {
        throw new Error(
          `EngineeringAllocation batchId mismatch: expected ${batchId}, got ${allocation.batchId}`
        );
      }
      await this.upsertAllocation(allocation);
    }
  }

  async saveMany(
    allocations: readonly EngineeringAllocation[]
  ): Promise<void> {
    for (const allocation of allocations) {
      await this.upsertAllocation(allocation);
    }
  }

  private async upsertAllocation(
    allocation: EngineeringAllocation
  ): Promise<void> {
    await this.db.query(UPSERT_ALLOCATION, [
      allocation.batchId,
      allocation.issueKey,
      allocation.developer,
      allocation.technology,
      allocation.originalEstimateHours,
      allocation.resolvedEstimateHours,
      allocation.actualHours,
      allocation.worklogCount,
    ]);
  }

  async findByBatch(
    batchId: BatchId
  ): Promise<readonly EngineeringAllocation[]> {
    const result = await this.db.query<EngineeringAllocationRow>(
      `SELECT * FROM engineering_allocation
       WHERE batch_id = $1
       ORDER BY issue_key, developer`,
      [batchId]
    );

    return result.rows.map(mapEngineeringAllocationRow);
  }

  async findByIssue(
    issueKey: string
  ): Promise<readonly EngineeringAllocation[]> {
    const result = await this.db.query<EngineeringAllocationRow>(
      `SELECT * FROM engineering_allocation
       WHERE issue_key = $1
       ORDER BY batch_id, developer`,
      [issueKey]
    );

    return result.rows.map(mapEngineeringAllocationRow);
  }

  async findByDeveloper(
    developer: string
  ): Promise<readonly EngineeringAllocation[]> {
    const result = await this.db.query<EngineeringAllocationRow>(
      `SELECT * FROM engineering_allocation
       WHERE developer = $1
       ORDER BY batch_id, issue_key`,
      [developer]
    );

    return result.rows.map(mapEngineeringAllocationRow);
  }

  async findByDateRange(
    range: DateRange
  ): Promise<readonly EngineeringAllocation[]> {
    const result = await this.db.query<EngineeringAllocationRow>(
      `SELECT ea.*
       FROM engineering_allocation ea
       INNER JOIN sync_batch sb ON sb.batch_id = ea.batch_id
       WHERE sb.started_at >= $1::timestamptz
         AND sb.started_at <= $2::timestamptz
       ORDER BY sb.started_at DESC, ea.issue_key, ea.developer`,
      [range.from, range.to]
    );

    return result.rows.map(mapEngineeringAllocationRow);
  }
}
