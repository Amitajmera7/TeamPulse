import type { JiraIssueInput, ResolvedWorklogs, TaskWorklog } from "./types";

/**
 * Resolves developer worklogs for a task.
 *
 * TODO: Implement worklog extraction from Jira issue payload.
 * TODO: Filter worklogs by developer display name.
 * TODO: Apply worklog interpretation rules from issue-types config.
 */
export function resolveWorklogs(
  issue: JiraIssueInput,
  developer: string
): ResolvedWorklogs {
  void issue;

  const worklogs: TaskWorklog[] = [];

  return {
    issueKey: issue.key ?? "",
    developer,
    worklogs,
    totalHours: 0,
    worklogCount: worklogs.length,
  };
}
