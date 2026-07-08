import { isBugWork } from "@/config/issue-types";

import { readIssueType } from "../resolve-estimate";
import { readRawWorklogs } from "../parse-worklogs";
import type { JiraIssueInput } from "../types";
import type { BugType, QualityBugRecord } from "./types";

/**
 * Returns true when a bug issue contains at least one worklog entry.
 */
export function bugHasWorklogs(issue: JiraIssueInput): boolean {
  return readRawWorklogs(issue).length > 0;
}

/**
 * Classifies a bug issue as QA Bug or UAT Bug.
 *
 * Returns null for non-bug issue types.
 */
export function classifyBugType(issue: JiraIssueInput): BugType | null {
  const issueType = readIssueType(issue);

  if (issueType === "QA Bug") {
    return "QA Bug";
  }

  if (issueType === "UAT Bug") {
    return "UAT Bug";
  }

  if (isBugWork(issueType)) {
    return issueType as BugType;
  }

  return null;
}

/**
 * Deduplicates bug records by issue key so reopened bugs count once.
 */
export function dedupeBugsByKey(
  bugs: QualityBugRecord[]
): QualityBugRecord[] {
  const seen = new Set<string>();

  return bugs.filter((bug) => {
    if (seen.has(bug.issueKey)) {
      return false;
    }
    seen.add(bug.issueKey);
    return true;
  });
}

/**
 * Collects qualifying QA / UAT bugs linked to completed feature work.
 *
 * Only bugs with worklogs are included. Bug severity is ignored in Version 1.
 */
export function collectQualityBugs(
  linkedBugs: JiraIssueInput[]
): QualityBugRecord[] {
  const records = linkedBugs
    .map((issue) => {
      const bugType = classifyBugType(issue);
      if (!bugType || !bugHasWorklogs(issue)) {
        return null;
      }

      return {
        issueKey: issue.key ?? "",
        bugType,
      };
    })
    .filter((record): record is QualityBugRecord => record !== null);

  return dedupeBugsByKey(records);
}

/**
 * Counts QA and UAT bugs from deduplicated bug records.
 */
export function countBugsByType(bugs: QualityBugRecord[]): {
  qaBugCount: number;
  uatBugCount: number;
} {
  return bugs.reduce(
    (counts, bug) => {
      if (bug.bugType === "QA Bug") {
        counts.qaBugCount += 1;
      } else {
        counts.uatBugCount += 1;
      }
      return counts;
    },
    { qaBugCount: 0, uatBugCount: 0 }
  );
}
