import type { JiraIssueInput } from "./types";

/** Jira issuetype names treated as Story-level parents. */
const STORY_ISSUE_TYPES = new Set(["Story"]);

/** Jira issuetype names treated as engineering subtasks. */
const ENGINEERING_SUBTASK_TYPES = new Set(["Sub-task", "Subtask"]);

/**
 * Reads the Jira issuetype name from an issue payload.
 */
export function readJiraIssueTypeName(issue: JiraIssueInput): string {
  const issuetype = issue.fields?.issuetype as { name?: string } | undefined;
  return issuetype?.name ?? "";
}

/**
 * Returns true when the issue is a Story-level work item.
 */
export function isStoryIssue(issue: JiraIssueInput): boolean {
  return STORY_ISSUE_TYPES.has(readJiraIssueTypeName(issue));
}

/**
 * Returns true when the issue is an engineering subtask.
 */
export function isEngineeringSubtask(issue: JiraIssueInput): boolean {
  return ENGINEERING_SUBTASK_TYPES.has(readJiraIssueTypeName(issue));
}

/**
 * Reads nested subtask issue payloads embedded on a parent issue.
 */
function readNestedSubtasks(issue: JiraIssueInput): JiraIssueInput[] {
  const subtasks = issue.fields?.subtasks;
  if (!Array.isArray(subtasks)) {
    return [];
  }

  return subtasks.filter(
    (entry): entry is JiraIssueInput =>
      typeof entry === "object" && entry !== null
  );
}

/**
 * Collects issue payloads that may contain engineering worklogs.
 *
 * Engineering worklogs live on engineering subtasks only.
 * Story-level worklogs are never included.
 */
export function collectWorklogSources(issue: JiraIssueInput): JiraIssueInput[] {
  if (isEngineeringSubtask(issue)) {
    return [issue];
  }

  const engineeringSubtasks = readNestedSubtasks(issue).filter(
    isEngineeringSubtask
  );

  if (engineeringSubtasks.length > 0) {
    return engineeringSubtasks;
  }

  if (isStoryIssue(issue)) {
    return [];
  }

  const nestedSubtasks = readNestedSubtasks(issue);
  if (nestedSubtasks.length > 0) {
    return nestedSubtasks.filter(isEngineeringSubtask);
  }

  return [];
}
