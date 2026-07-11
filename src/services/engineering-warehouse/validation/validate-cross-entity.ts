/**
 * Cross-entity validators for an in-memory warehouse model.
 */

import type { EngineeringAllocation } from "../entities/engineering-allocation";
import type { EngineeringIssue } from "../entities/engineering-issue";
import type { EngineeringWorklog } from "../entities/engineering-worklog";
import type { SyncBatch } from "../entities/sync-batch";
import { type ValidationCollector } from "./collector";

const HOURS_EPSILON = 1e-6;

function pairKey(issueKey: string, developer: string): string {
  return `${issueKey}\0${developer}`;
}

/**
 * Cross-entity consistency:
 * - allocation / worklog issueKeys exist (also checked per-entity; retained here)
 * - allocation actualHours totals equal worklog hour totals per developer×issue
 * - batch counts match entity counts
 */
export function validateCrossEntity(
  batch: SyncBatch,
  issues: readonly EngineeringIssue[],
  allocations: readonly EngineeringAllocation[],
  worklogs: readonly EngineeringWorklog[],
  collector: ValidationCollector
): void {
  const issueKeys = new Set(issues.map((issue) => issue.issueKey));

  for (const allocation of allocations) {
    if (allocation.issueKey && !issueKeys.has(allocation.issueKey)) {
      collector.error(
        "CROSS_ALLOCATION_ISSUE_MISSING",
        "CrossEntity",
        `Allocation references missing issueKey "${allocation.issueKey}".`,
        allocation.issueKey
      );
    }
  }

  for (const worklog of worklogs) {
    if (worklog.issueKey && !issueKeys.has(worklog.issueKey)) {
      collector.error(
        "CROSS_WORKLOG_ISSUE_MISSING",
        "CrossEntity",
        `Worklog references missing issueKey "${worklog.issueKey}".`,
        worklog.worklogKey || worklog.issueKey
      );
    }
  }

  const worklogTotals = new Map<string, { hours: number; count: number }>();
  for (const worklog of worklogs) {
    if (!worklog.issueKey || !worklog.developer) {
      continue;
    }
    const key = pairKey(worklog.issueKey, worklog.developer);
    const current = worklogTotals.get(key) ?? { hours: 0, count: 0 };
    current.hours += worklog.hours;
    current.count += 1;
    worklogTotals.set(key, current);
  }

  for (const allocation of allocations) {
    if (!allocation.issueKey || !allocation.developer) {
      continue;
    }
    const key = pairKey(allocation.issueKey, allocation.developer);
    const totals = worklogTotals.get(key) ?? { hours: 0, count: 0 };
    const path = `${allocation.issueKey}/${allocation.developer}`;

    if (Math.abs(allocation.actualHours - totals.hours) > HOURS_EPSILON) {
      collector.error(
        "CROSS_ALLOCATION_WORKLOG_HOURS",
        "CrossEntity",
        `Allocation actualHours (${allocation.actualHours}) does not equal worklog hours total (${totals.hours}).`,
        path
      );
    }

    if (allocation.worklogCount !== totals.count) {
      collector.warning(
        "CROSS_ALLOCATION_WORKLOG_COUNT",
        "CrossEntity",
        `Allocation worklogCount (${allocation.worklogCount}) does not equal worklog row count (${totals.count}).`,
        path
      );
    }

    worklogTotals.delete(key);
  }

  for (const [key, totals] of worklogTotals) {
    if (totals.hours <= 0 && totals.count === 0) {
      continue;
    }
    const [issueKey, developer] = key.split("\0");
    collector.error(
      "CROSS_WORKLOG_WITHOUT_ALLOCATION",
      "CrossEntity",
      `Worklogs exist for ${developer} / ${issueKey} without a matching allocation (${totals.count} rows, ${totals.hours} hours).`,
      `${issueKey}/${developer}`
    );
  }

  if (batch.issuesProcessed !== issues.length) {
    collector.error(
      "CROSS_BATCH_ISSUE_COUNT",
      "CrossEntity",
      `SyncBatch.issuesProcessed (${batch.issuesProcessed}) does not match EngineeringIssue count (${issues.length}).`
    );
  }

  if (batch.worklogsProcessed !== worklogs.length) {
    collector.error(
      "CROSS_BATCH_WORKLOG_COUNT",
      "CrossEntity",
      `SyncBatch.worklogsProcessed (${batch.worklogsProcessed}) does not match EngineeringWorklog count (${worklogs.length}).`
    );
  }
}
