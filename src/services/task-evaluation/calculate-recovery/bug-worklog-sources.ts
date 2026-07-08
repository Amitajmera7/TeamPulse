import { readIssueType } from "../resolve-estimate";
import {
  filterDeveloperWorklogs,
  readRawWorklogs,
  secondsToDecimalHours,
  sumWorklogHours,
} from "../parse-worklogs";
import type { JiraIssueInput } from "../types";
import type { RecoveryBugType } from "./types";

/**
 * Classifies an issue as QA Bug or UAT Bug.
 *
 * Returns null for all other issue types.
 */
export function classifyRecoveryBugType(
  issue: JiraIssueInput
): RecoveryBugType | null {
  const issueType = readIssueType(issue);

  if (issueType === "QA Bug" || issueType === "UAT Bug") {
    return issueType;
  }

  return null;
}

/**
 * Returns true when a bug issue contains at least one worklog entry.
 */
export function recoveryBugHasWorklogs(issue: JiraIssueInput): boolean {
  return readRawWorklogs(issue).length > 0;
}

/**
 * Deduplicates bug issues by issue key so reopened bugs count once.
 */
export function dedupeBugIssuesByKey(
  bugs: JiraIssueInput[]
): JiraIssueInput[] {
  const seen = new Set<string>();

  return bugs.filter((issue) => {
    const key = issue.key ?? "";
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Collects QA / UAT bugs that contain worklogs.
 *
 * Non-bug issue types and bugs without worklogs are ignored.
 */
export function collectRecoveryBugs(
  linkedBugs: JiraIssueInput[]
): JiraIssueInput[] {
  const qualifying = linkedBugs.filter((issue) => {
    return (
      classifyRecoveryBugType(issue) !== null &&
      recoveryBugHasWorklogs(issue)
    );
  });

  return dedupeBugIssuesByKey(qualifying);
}

/**
 * Sums all recovery worklog hours on a bug issue (all developers).
 */
export function sumBugRecoveryHours(issue: JiraIssueInput): number {
  return readRawWorklogs(issue).reduce(
    (total, entry) => total + secondsToDecimalHours(entry.timeSpentSeconds ?? 0),
    0
  );
}

/**
 * Sums a developer's recovery worklog hours on a single bug issue.
 */
export function sumDeveloperBugRecoveryHours(
  issue: JiraIssueInput,
  developer: string
): number {
  return sumWorklogHours(
    filterDeveloperWorklogs(readRawWorklogs(issue), developer)
  );
}
