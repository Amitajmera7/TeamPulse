/**
 * EngineeringAllocation entity validators.
 */

import type { EngineeringAllocation } from "../entities/engineering-allocation";
import type { EngineeringIssue } from "../entities/engineering-issue";
import type { SyncBatch } from "../entities/sync-batch";
import {
  isFiniteNumber,
  isNonEmptyString,
  type ValidationCollector,
} from "./collector";

export function validateEngineeringAllocations(
  batch: SyncBatch,
  issues: readonly EngineeringIssue[],
  allocations: readonly EngineeringAllocation[],
  collector: ValidationCollector
): void {
  const issueKeys = new Set(
    issues.map((issue) => issue.issueKey).filter(isNonEmptyString)
  );
  const seenPairs = new Map<string, number>();

  allocations.forEach((allocation, index) => {
    const path = `allocations[${index}]`;
    const pairKey = `${allocation.issueKey}\0${allocation.developer}`;

    if (allocation.batchId !== batch.batchId) {
      collector.error(
        "ALLOCATION_BATCH_MISMATCH",
        "EngineeringAllocation",
        `Allocation batchId "${allocation.batchId}" does not reference SyncBatch "${batch.batchId}".`,
        path
      );
    }

    if (!isNonEmptyString(allocation.issueKey)) {
      collector.error(
        "ALLOCATION_ISSUE_KEY_MISSING",
        "EngineeringAllocation",
        "issueKey must be a non-empty string.",
        path
      );
    } else if (!issueKeys.has(allocation.issueKey)) {
      collector.error(
        "ALLOCATION_ISSUE_REF",
        "EngineeringAllocation",
        `issueKey "${allocation.issueKey}" does not reference EngineeringIssue.`,
        path
      );
    }

    if (!isNonEmptyString(allocation.developer)) {
      collector.error(
        "ALLOCATION_DEVELOPER_MISSING",
        "EngineeringAllocation",
        "developer must be a non-empty string.",
        path
      );
    }

    if (isNonEmptyString(allocation.issueKey) && isNonEmptyString(allocation.developer)) {
      const prior = seenPairs.get(pairKey);
      if (prior != null) {
        collector.error(
          "ALLOCATION_DUPLICATE_PAIR",
          "EngineeringAllocation",
          `Duplicate developer/issue pair "${allocation.developer}" / "${allocation.issueKey}" (also at allocations[${prior}]).`,
          path
        );
      } else {
        seenPairs.set(pairKey, index);
      }
    }

    if (
      !isFiniteNumber(allocation.resolvedEstimateHours) ||
      allocation.resolvedEstimateHours < 0
    ) {
      collector.error(
        "ALLOCATION_RESOLVED_ESTIMATE_INVALID",
        "EngineeringAllocation",
        "resolvedEstimate must be >= 0.",
        path
      );
    }

    if (
      !isFiniteNumber(allocation.actualHours) ||
      allocation.actualHours < 0
    ) {
      collector.error(
        "ALLOCATION_ACTUAL_HOURS_INVALID",
        "EngineeringAllocation",
        "actualHours must be >= 0.",
        path
      );
    }

    if (
      !isFiniteNumber(allocation.worklogCount) ||
      allocation.worklogCount < 0
    ) {
      collector.error(
        "ALLOCATION_WORKLOG_COUNT_INVALID",
        "EngineeringAllocation",
        "worklogCount must be >= 0.",
        path
      );
    }
  });
}
