/**
 * Engineering Analytics Warehouse — public module entry.
 *
 * Sprint 5A Milestone 12A: domain entities + repository contracts.
 * Sprint 5B Milestone 13A: PostgreSQL persistence foundation (not wired to runtime).
 */

export {
  WAREHOUSE_SCHEMA_VERSION,
} from "./types";

export type {
  BatchId,
  DateRange,
  IsoTimestamp,
  WarehouseBatchStatus,
  WarehouseSchemaVersion,
} from "./types";

export type { SyncBatch } from "./entities/sync-batch";
export type { EngineeringIssue } from "./entities/engineering-issue";
export type { EngineeringAllocation } from "./entities/engineering-allocation";
export type { EngineeringWorklog } from "./entities/engineering-worklog";

export type { SyncBatchRepository } from "./repositories/sync-batch-repository";
export type { EngineeringIssueRepository } from "./repositories/engineering-issue-repository";
export type { EngineeringAllocationRepository } from "./repositories/engineering-allocation-repository";
export type { EngineeringWorklogRepository } from "./repositories/engineering-worklog-repository";

export {
  WAREHOUSE_DDL_VERSION,
  WAREHOUSE_INITIAL_MIGRATION_ID,
  WAREHOUSE_SCHEMA_STATEMENTS,
  buildEngineeringWorklogKey,
  canonicalWorklogHours,
  closeWarehousePool,
  createPostgresWarehouseRepositories,
  getWarehousePool,
  getWarehousePoolConfig,
  getWarehouseQueryable,
  getWarehouseSchemaSql,
  PostgresEngineeringAllocationRepository,
  PostgresEngineeringIssueRepository,
  PostgresEngineeringWorklogRepository,
  PostgresSyncBatchRepository,
  withWarehouseTransaction,
} from "./persistence";

export type {
  BuildEngineeringWorklogKeyInput,
  PostgresWarehouseRepositories,
  Queryable,
  WarehouseTransactionClient,
} from "./persistence";
