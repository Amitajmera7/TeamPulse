import type { JiraIssueInput, JiraWorklogEntry, TaskWorklog } from "./types";

/**
 * Reads raw worklog entries from a Jira issue payload.
 */
export function readRawWorklogs(issue: JiraIssueInput): JiraWorklogEntry[] {
  const worklogField = issue.fields?.worklog as
    | { worklogs?: JiraWorklogEntry[] }
    | undefined;

  return worklogField?.worklogs ?? [];
}

/**
 * Converts Jira worklog duration from seconds to decimal hours.
 */
export function secondsToDecimalHours(seconds: number): number {
  return seconds / 3600;
}

/**
 * Filters raw Jira worklogs to a single developer.
 *
 * Matching uses exact Jira author displayName equality.
 */
export function filterDeveloperWorklogs(
  entries: JiraWorklogEntry[],
  developer: string
): TaskWorklog[] {
  return entries
    .filter((entry) => entry.author?.displayName === developer)
    .map((entry) => ({
      developer,
      hours: secondsToDecimalHours(entry.timeSpentSeconds ?? 0),
      startedAt: entry.started ?? null,
    }));
}

/**
 * Aggregates developer worklog hours.
 */
export function sumWorklogHours(worklogs: TaskWorklog[]): number {
  return worklogs.reduce((total, entry) => total + entry.hours, 0);
}

/**
 * Returns the earliest and latest worklog start timestamps.
 */
export function resolveWorklogDateRange(worklogs: TaskWorklog[]): {
  firstWorklogDate: string | null;
  lastWorklogDate: string | null;
} {
  const timestamps = worklogs
    .map((entry) => entry.startedAt)
    .filter((value): value is string => Boolean(value))
    .sort();

  if (timestamps.length === 0) {
    return { firstWorklogDate: null, lastWorklogDate: null };
  }

  return {
    firstWorklogDate: timestamps[0],
    lastWorklogDate: timestamps[timestamps.length - 1],
  };
}

/**
 * Collects developer worklogs from all engineering worklog sources.
 */
export function gatherDeveloperWorklogs(
  sources: JiraIssueInput[],
  developer: string
): TaskWorklog[] {
  return sources.flatMap((source) =>
    filterDeveloperWorklogs(readRawWorklogs(source), developer)
  );
}
