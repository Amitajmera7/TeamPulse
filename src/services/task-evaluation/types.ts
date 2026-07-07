/**
 * Task Evaluation Engine — type definitions.
 *
 * These types represent factual task data only.
 * Scores and derived metrics belong in future milestones.
 */

/** A single Jira worklog attributed to a developer. */
export interface TaskWorklog {
  developer: string;
  hours: number;
  startedAt: string | null;
}

/** Output of the Estimate Resolution step (factual, not scored). */
export interface ResolvedEstimate {
  issueKey: string;
  developer: string;
  technology: string;
  issueType: string;
  estimateHours: number;
  estimateSource: string;
}

/** Output of the Worklog Resolution step (factual, not scored). */
export interface ResolvedWorklogs {
  issueKey: string;
  developer: string;
  worklogs: TaskWorklog[];
  totalHours: number;
  worklogCount: number;
}

/**
 * Factual evaluation record for a completed engineering task.
 *
 * Contains resolved inputs only — no efficiency, quality, contribution,
 * or composite scores.
 */
export interface TaskEvaluation {
  issueKey: string;
  issueType: string;
  status: string;
  technology: string;
  developer: string;
  isDevelopmentComplete: boolean;
  estimateHours: number;
  estimateSource: string;
  actualHours: number;
  worklogCount: number;
  worklogs: TaskWorklog[];
  evaluatedAt: string;
}

/** Minimal Jira issue shape accepted by the evaluation orchestrator. */
export interface JiraIssueInput {
  key?: string;
  fields?: Record<string, unknown>;
}

/** Options passed to the task evaluation orchestrator. */
export interface EvaluateTaskOptions {
  developer: string;
  evaluatedAt?: string;
}
