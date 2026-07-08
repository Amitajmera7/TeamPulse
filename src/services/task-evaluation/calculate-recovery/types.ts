import type { JiraIssueInput } from "../types";

export type RecoveryBugType = "QA Bug" | "UAT Bug";

export type RecoveryRating = "Low" | "Medium" | "High";

/** Inputs for recovery effort calculation. */
export interface RecoveryInput {
  /** Developer whose recovery worklogs are measured. */
  developer: string;
  /** QA / UAT bug issues in the evaluation scope. */
  linkedBugs: JiraIssueInput[];
}

/** Aggregated recovery hours for a developer. */
export interface RecoveryHoursBreakdown {
  qaRecoveryHours: number;
  uatRecoveryHours: number;
  totalRecoveryHours: number;
  qaBugCount: number;
  uatBugCount: number;
}

/** Output of the Recovery Engine. */
export interface RecoveryResult {
  resolved: boolean;
  qaRecoveryHours: number;
  uatRecoveryHours: number;
  totalRecoveryHours: number;
  qaBugCount: number;
  uatBugCount: number;
  recoveryPercentage: number;
  rating: RecoveryRating;
}
