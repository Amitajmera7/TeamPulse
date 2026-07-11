/**
 * EAW Validation Harness — public entry.
 *
 * Sprint 5B Milestone 13B: in-memory validation only.
 * Not wired to orchestrator, PostgreSQL, engines, or dashboard.
 */

export type {
  EngineeringWarehouseModel,
  ValidationEntityKind,
  ValidationFinding,
  ValidationReport,
  ValidationSeverity,
} from "./types";

export { validateEngineeringWarehouseModel } from "./validate-warehouse-model";
export { validateSyncBatch } from "./validate-sync-batch";
export { validateEngineeringIssues } from "./validate-engineering-issues";
export { validateEngineeringAllocations } from "./validate-engineering-allocations";
export { validateEngineeringWorklogs } from "./validate-engineering-worklogs";
export { validateCrossEntity } from "./validate-cross-entity";
export { formatValidationSummary } from "./collector";
