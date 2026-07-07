import { readIssueType, resolveEstimate } from "./resolve-estimate";
import { resolveWorklogs } from "./resolve-worklogs";
import type {
  EvaluateTaskOptions,
  JiraIssueInput,
  TaskEvaluation,
} from "./types";

function readStatus(issue: JiraIssueInput): string {
  const status = issue.fields?.status as { name?: string } | undefined;
  return status?.name ?? "";
}

/**
 * Orchestrates task evaluation by resolving factual inputs.
 *
 * This function assembles a TaskEvaluation record only.
 * Scoring steps are stubbed and not invoked in Milestone 1.
 */
export function evaluateTask(
  issue: JiraIssueInput,
  options: EvaluateTaskOptions
): TaskEvaluation {
  const { developer, evaluatedAt = new Date().toISOString() } = options;

  const estimate = resolveEstimate(issue, developer);
  const worklogs = resolveWorklogs(issue, developer);

  // TODO: Determine Development Complete status via src/config/status-mapping.ts.
  const isDevelopmentComplete = false;

  // TODO: Wire calculateEfficiency once execution efficiency rules are implemented.
  // TODO: Wire calculateQuality once quality rules are implemented.
  // TODO: Wire calculateContribution once contribution rules are implemented.

  return {
    issueKey: issue.key ?? "",
    issueType: readIssueType(issue),
    status: readStatus(issue),
    technology: estimate.technology ?? "",
    developer,
    isDevelopmentComplete,
    estimateHours: estimate.hours,
    estimateSource: estimate.source,
    actualHours: worklogs.totalHours,
    worklogCount: worklogs.worklogCount,
    worklogs: worklogs.worklogs,
    evaluatedAt,
  };
}
