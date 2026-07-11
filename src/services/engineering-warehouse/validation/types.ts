/**
 * EAW Validation Harness — report and model types.
 *
 * Sprint 5B Milestone 13B — validation only (no PostgreSQL / runtime wiring).
 */

import type { EngineeringAllocation } from "../entities/engineering-allocation";
import type { EngineeringIssue } from "../entities/engineering-issue";
import type { EngineeringWorklog } from "../entities/engineering-worklog";
import type { SyncBatch } from "../entities/sync-batch";

/**
 * In-memory Engineering Analytics Warehouse model for one sync batch.
 * Produced by a future ingest mapper; validated before any persistence.
 */
export interface EngineeringWarehouseModel {
  readonly syncBatch: SyncBatch;
  readonly issues: readonly EngineeringIssue[];
  readonly allocations: readonly EngineeringAllocation[];
  readonly worklogs: readonly EngineeringWorklog[];
}

export type ValidationSeverity = "error" | "warning";

export type ValidationEntityKind =
  | "SyncBatch"
  | "EngineeringIssue"
  | "EngineeringAllocation"
  | "EngineeringWorklog"
  | "CrossEntity"
  | "Model";

/**
 * A single validation finding.
 */
export interface ValidationFinding {
  readonly severity: ValidationSeverity;
  /** Stable machine-readable code, e.g. `ISSUE_DUPLICATE_KEY`. */
  readonly code: string;
  readonly entity: ValidationEntityKind;
  readonly message: string;
  /** Optional locator (issue key, worklog key, index, etc.). */
  readonly path?: string;
}

/**
 * Structured validation report for an in-memory warehouse model.
 */
export interface ValidationReport {
  /** PASS when errors.length === 0 (warnings allowed). */
  readonly status: "PASS" | "FAIL";
  readonly batchId: string | null;
  readonly counts: {
    readonly issues: number;
    readonly worklogs: number;
    readonly allocations: number;
  };
  readonly errors: readonly ValidationFinding[];
  readonly warnings: readonly ValidationFinding[];
  /** Human-readable multi-line summary (Validation Summary block). */
  readonly summary: string;
}

export interface ValidationCollector {
  error(
    code: string,
    entity: ValidationEntityKind,
    message: string,
    path?: string
  ): void;
  warning(
    code: string,
    entity: ValidationEntityKind,
    message: string,
    path?: string
  ): void;
  findings(): readonly ValidationFinding[];
}
