/**
 * Validates an in-memory Engineering Analytics Warehouse model.
 *
 * Milestone 13B — does not write to PostgreSQL or change runtime sync.
 */

import {
  createValidationCollector,
  formatValidationSummary,
} from "./collector";
import type {
  EngineeringWarehouseModel,
  ValidationFinding,
  ValidationReport,
} from "./types";
import { validateCrossEntity } from "./validate-cross-entity";
import { validateEngineeringAllocations } from "./validate-engineering-allocations";
import { validateEngineeringIssues } from "./validate-engineering-issues";
import { validateEngineeringWorklogs } from "./validate-engineering-worklogs";
import { validateSyncBatch } from "./validate-sync-batch";

/**
 * Runs all EAW validators against {@link model} and returns a structured report.
 *
 * Status is PASS when there are zero errors (warnings do not fail the run).
 */
export function validateEngineeringWarehouseModel(
  model: EngineeringWarehouseModel
): ValidationReport {
  const collector = createValidationCollector();
  const { syncBatch, issues, allocations, worklogs } = model;

  validateSyncBatch(syncBatch, collector);
  validateEngineeringIssues(syncBatch, issues, collector);
  validateEngineeringAllocations(syncBatch, issues, allocations, collector);
  validateEngineeringWorklogs(syncBatch, issues, worklogs, collector);
  validateCrossEntity(syncBatch, issues, allocations, worklogs, collector);

  const findings = collector.findings();
  const errors = findings.filter(
    (finding): finding is ValidationFinding & { severity: "error" } =>
      finding.severity === "error"
  );
  const warnings = findings.filter(
    (finding): finding is ValidationFinding & { severity: "warning" } =>
      finding.severity === "warning"
  );

  const counts = {
    issues: issues.length,
    worklogs: worklogs.length,
    allocations: allocations.length,
  };

  const status = errors.length === 0 ? "PASS" : "FAIL";

  return {
    status,
    batchId: syncBatch.batchId ?? null,
    counts,
    errors,
    warnings,
    summary: formatValidationSummary({
      status,
      issues: counts.issues,
      worklogs: counts.worklogs,
      allocations: counts.allocations,
      errorCount: errors.length,
      warningCount: warnings.length,
    }),
  };
}
