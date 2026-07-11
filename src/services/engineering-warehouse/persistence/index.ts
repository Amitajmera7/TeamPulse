/**
 * Engineering Analytics Warehouse — PostgreSQL persistence entry.
 *
 * Sprint 5B Milestone 13A: infrastructure only.
 * Not wired into orchestrator, engines, or dashboard.
 */

import type { Queryable } from "./queryable";
import { getWarehouseQueryable } from "./connection";
import { PostgresSyncBatchRepository } from "./repositories/sync-batch-postgres";
import { PostgresEngineeringIssueRepository } from "./repositories/engineering-issue-postgres";
import { PostgresEngineeringAllocationRepository } from "./repositories/engineering-allocation-postgres";
import { PostgresEngineeringWorklogRepository } from "./repositories/engineering-worklog-postgres";

export type { Queryable } from "./queryable";
export {
  closeWarehousePool,
  getWarehousePool,
  getWarehousePoolConfig,
  getWarehouseQueryable,
  setWarehousePoolForTests,
} from "./connection";
export {
  withWarehouseTransaction,
  type WarehouseTransactionClient,
} from "./transaction";
export {
  WAREHOUSE_DDL_VERSION,
  WAREHOUSE_INITIAL_MIGRATION_ID,
  WAREHOUSE_SCHEMA_STATEMENTS,
  getWarehouseSchemaSql,
} from "./schema";
export {
  buildEngineeringWorklogKey,
  canonicalWorklogHours,
} from "./worklog-identity";
export type { BuildEngineeringWorklogKeyInput } from "./worklog-identity";

export { PostgresSyncBatchRepository } from "./repositories/sync-batch-postgres";
export { PostgresEngineeringIssueRepository } from "./repositories/engineering-issue-postgres";
export { PostgresEngineeringAllocationRepository } from "./repositories/engineering-allocation-postgres";
export { PostgresEngineeringWorklogRepository } from "./repositories/engineering-worklog-postgres";

/** Bundle of PostgreSQL repository implementations bound to one {@link Queryable}. */
export interface PostgresWarehouseRepositories {
  syncBatches: PostgresSyncBatchRepository;
  issues: PostgresEngineeringIssueRepository;
  allocations: PostgresEngineeringAllocationRepository;
  worklogs: PostgresEngineeringWorklogRepository;
}

/**
 * Creates PostgreSQL repositories sharing the same queryable
 * (pool by default, or a transaction client for atomic batch commits).
 */
export function createPostgresWarehouseRepositories(
  db: Queryable = getWarehouseQueryable()
): PostgresWarehouseRepositories {
  return {
    syncBatches: new PostgresSyncBatchRepository(db),
    issues: new PostgresEngineeringIssueRepository(db),
    allocations: new PostgresEngineeringAllocationRepository(db),
    worklogs: new PostgresEngineeringWorklogRepository(db),
  };
}
