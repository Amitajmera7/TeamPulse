import type { JiraIssueInput } from "../types";

/** Inputs for business contribution calculation. */
export interface ContributionInput {
  /** Developer whose delivered engineering value is measured. */
  developer: string;
  /** Engineering issues in the evaluation scope. */
  issues: JiraIssueInput[];
}

/** Output of the Business Contribution Engine. */
export interface ContributionResult {
  /** True when contribution was calculated for the scope. */
  resolved: boolean;
  /** Developer's allocated delivered engineering hours. */
  deliveredEngineeringHours: number;
  /** Share of total delivered engineering hours in scope (0–100). */
  contributionPercentage: number;
  /** Completed feature tasks where the developer received allocated contribution. */
  completedTasks: number;
}
