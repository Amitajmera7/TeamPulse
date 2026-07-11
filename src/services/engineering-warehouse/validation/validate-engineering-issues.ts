/**
 * EngineeringIssue entity validators.
 */

import type { EngineeringIssue } from "../entities/engineering-issue";
import type { SyncBatch } from "../entities/sync-batch";
import {
  isNonEmptyString,
  parseTimestamp,
  type ValidationCollector,
} from "./collector";

export function validateEngineeringIssues(
  batch: SyncBatch,
  issues: readonly EngineeringIssue[],
  collector: ValidationCollector
): void {
  const seenKeys = new Map<string, number>();

  issues.forEach((issue, index) => {
    const path = `issues[${index}]`;

    if (issue.batchId !== batch.batchId) {
      collector.error(
        "ISSUE_BATCH_MISMATCH",
        "EngineeringIssue",
        `Issue batchId "${issue.batchId}" does not match SyncBatch "${batch.batchId}".`,
        path
      );
    }

    if (!isNonEmptyString(issue.issueKey)) {
      collector.error(
        "ISSUE_KEY_MISSING",
        "EngineeringIssue",
        "issueKey must be a non-empty string.",
        path
      );
    } else {
      const prior = seenKeys.get(issue.issueKey);
      if (prior != null) {
        collector.error(
          "ISSUE_DUPLICATE_KEY",
          "EngineeringIssue",
          `Duplicate issueKey "${issue.issueKey}" (also at issues[${prior}]).`,
          path
        );
      } else {
        seenKeys.set(issue.issueKey, index);
      }
    }

    if (!isNonEmptyString(issue.technology)) {
      collector.error(
        "ISSUE_TECHNOLOGY_MISSING",
        "EngineeringIssue",
        "technology must exist.",
        issue.issueKey || path
      );
    }

    if (!isNonEmptyString(issue.issueType)) {
      collector.error(
        "ISSUE_TYPE_MISSING",
        "EngineeringIssue",
        "issueType must exist.",
        issue.issueKey || path
      );
    }

    if (!isNonEmptyString(issue.projectKey)) {
      collector.error(
        "ISSUE_PROJECT_KEY_MISSING",
        "EngineeringIssue",
        "projectKey must exist.",
        issue.issueKey || path
      );
    }

    if (!isNonEmptyString(issue.created)) {
      collector.error(
        "ISSUE_CREATED_MISSING",
        "EngineeringIssue",
        "created must be a non-empty ISO timestamp.",
        issue.issueKey || path
      );
    } else if (parseTimestamp(issue.created) == null) {
      collector.error(
        "ISSUE_CREATED_INVALID",
        "EngineeringIssue",
        `created is not a valid timestamp: ${issue.created}`,
        issue.issueKey || path
      );
    }

    if (issue.resolved != null) {
      const createdMs = parseTimestamp(issue.created);
      const resolvedMs = parseTimestamp(issue.resolved);
      if (resolvedMs == null) {
        collector.error(
          "ISSUE_RESOLVED_INVALID",
          "EngineeringIssue",
          `resolved is not a valid timestamp: ${issue.resolved}`,
          issue.issueKey || path
        );
      } else if (createdMs != null && createdMs > resolvedMs) {
        collector.error(
          "ISSUE_TIME_ORDER",
          "EngineeringIssue",
          "created must be <= resolved when resolved is set.",
          issue.issueKey || path
        );
      }
    }
  });
}
