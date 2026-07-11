/**
 * Engineering Analytics Warehouse — public module entry.
 *
 * Sprint 5A Milestone 12A: architecture only.
 * Domain entities + repository contracts. No database implementation.
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
