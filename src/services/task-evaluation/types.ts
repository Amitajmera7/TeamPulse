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

/**
 * Describes how an engineering estimate was resolved.
 *
 * All unresolved outcomes use `resolved: false` and `hours: 0`.
 */
export type EstimateSource =
  | "jira-original-estimate"
  | "technology-estimate-field"
  | "unknown-developer"
  | "missing-estimate"
  | "unsupported-issue-type";

/** Output of the Estimate Resolution Engine (factual, not scored). */
export interface ResolvedEstimate {
  /** Resolved estimate in hours. Zero when unresolved. */
  hours: number;
  /** Resolution method or unresolved reason. */
  source: EstimateSource;
  /** Jira field path used or attempted during resolution. */
  field: string;
  /** True when a valid estimate was resolved. */
  resolved: boolean;
  /** Developer technology when resolved for CR / RE work. */
  technology?: string;
}

/** Output of the Worklog Resolution Engine (factual, not scored). */
export interface ResolvedWorklogs {
  /** True when at least one developer worklog was found. */
  resolved: boolean;
  /** Sum of developer worklog hours (decimal). */
  actualHours: number;
  /** Number of matching developer worklogs. */
  worklogCount: number;
  /** Earliest worklog start timestamp for the developer, if any. */
  firstWorklogDate: string | null;
  /** Latest worklog start timestamp for the developer, if any. */
  lastWorklogDate: string | null;
  /** Developer worklogs only — never total issue worklogs. */
  worklogs: TaskWorklog[];
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
  estimateSource: EstimateSource | string;
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

/** Raw Jira worklog entry shape used during resolution. */
export interface JiraWorklogEntry {
  author?: { displayName?: string };
  timeSpentSeconds?: number;
  started?: string;
}

/** Options passed to the task evaluation orchestrator. */
export interface EvaluateTaskOptions {
  developer: string;
  evaluatedAt?: string;
}

/** Reason execution efficiency could not be calculated. */
export type ExecutionEfficiencyReason =
  | "missing-estimate"
  | "missing-worklogs"
  | "invalid-allocation";

/** Human-readable execution efficiency band. */
export type EfficiencyRating =
  | "Excellent"
  | "Very Good"
  | "On Track"
  | "Needs Improvement"
  | "Critical Overrun"
  | "Unresolved";

/** Inputs required to calculate execution efficiency. */
export interface ExecutionEfficiencyInput {
  estimate: ResolvedEstimate;
  worklogs: ResolvedWorklogs;
  /** Denominator used for estimate allocation (subtask or technology total hours). */
  allocationDenominatorHours: number;
}

/** Output of the Execution Efficiency Engine. */
export interface ExecutionEfficiencyResult {
  resolved: boolean;
  reason?: ExecutionEfficiencyReason;
  allocatedEstimate: number;
  actualHours: number;
  variancePercentage: number;
  tolerancePercentage: number;
  efficiencyScore: number;
  rating: EfficiencyRating;
}
