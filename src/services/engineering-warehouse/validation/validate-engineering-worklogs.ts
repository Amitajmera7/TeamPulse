/**
 * EngineeringWorklog entity validators.
 */

import type { EngineeringIssue } from "../entities/engineering-issue";
import type { EngineeringWorklog } from "../entities/engineering-worklog";
import type { SyncBatch } from "../entities/sync-batch";
import {
  isFiniteNumber,
  isNonEmptyString,
  type ValidationCollector,
} from "./collector";

export function validateEngineeringWorklogs(
  batch: SyncBatch,
  issues: readonly EngineeringIssue[],
  worklogs: readonly EngineeringWorklog[],
  collector: ValidationCollector
): void {
  const issueKeys = new Set(
    issues.map((issue) => issue.issueKey).filter(isNonEmptyString)
  );
  const seenKeys = new Map<string, number>();

  worklogs.forEach((worklog, index) => {
    const path = `worklogs[${index}]`;

    if (worklog.batchId !== batch.batchId) {
      collector.error(
        "WORKLOG_BATCH_MISMATCH",
        "EngineeringWorklog",
        `Worklog batchId "${worklog.batchId}" does not exist as SyncBatch "${batch.batchId}".`,
        path
      );
    }

    if (!isNonEmptyString(worklog.worklogKey)) {
      collector.error(
        "WORKLOG_KEY_MISSING",
        "EngineeringWorklog",
        "worklog identity (worklogKey) must be a non-empty string.",
        path
      );
    } else {
      const prior = seenKeys.get(worklog.worklogKey);
      if (prior != null) {
        collector.error(
          "WORKLOG_DUPLICATE_IDENTITY",
          "EngineeringWorklog",
          `Duplicate worklog identity "${worklog.worklogKey}" (also at worklogs[${prior}]).`,
          path
        );
      } else {
        seenKeys.set(worklog.worklogKey, index);
      }
    }

    if (!isFiniteNumber(worklog.hours) || worklog.hours <= 0) {
      collector.error(
        "WORKLOG_HOURS_INVALID",
        "EngineeringWorklog",
        "hours must be > 0.",
        worklog.worklogKey || path
      );
    }

    if (!isNonEmptyString(worklog.issueKey)) {
      collector.error(
        "WORKLOG_ISSUE_KEY_MISSING",
        "EngineeringWorklog",
        "issueKey must exist.",
        path
      );
    } else if (!issueKeys.has(worklog.issueKey)) {
      collector.error(
        "WORKLOG_ISSUE_REF",
        "EngineeringWorklog",
        `issueKey "${worklog.issueKey}" does not reference EngineeringIssue.`,
        worklog.worklogKey || path
      );
    }

    if (!isNonEmptyString(worklog.developer)) {
      collector.error(
        "WORKLOG_DEVELOPER_MISSING",
        "EngineeringWorklog",
        "developer must exist.",
        worklog.worklogKey || path
      );
    }
  });
}
