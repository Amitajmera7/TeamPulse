import {
  allocateContributionHours,
  resolveIssueDeliveredTotal,
} from "./contribution-allocation";
import { collectContributionIssues } from "./contribution-sources";
import { calculateContributionPercentage } from "./contribution-percentage";
import type { ContributionInput, ContributionResult } from "./types";

/**
 * Sums a developer's allocated delivered engineering hours across qualifying issues.
 */
export function calculateDeveloperDeliveredHours(
  issues: ContributionInput["issues"],
  developer: string
): { deliveredEngineeringHours: number; completedTasks: number } {
  const qualifyingIssues = collectContributionIssues(issues);

  let deliveredEngineeringHours = 0;
  let completedTasks = 0;

  for (const issue of qualifyingIssues) {
    const allocatedHours = allocateContributionHours(issue, developer);

    if (allocatedHours > 0) {
      deliveredEngineeringHours += allocatedHours;
      completedTasks += 1;
    }
  }

  return { deliveredEngineeringHours, completedTasks };
}

/**
 * Sums total delivered engineering hours across all qualifying issues in scope.
 */
export function calculateTotalDeliveredHours(
  issues: ContributionInput["issues"]
): number {
  const qualifyingIssues = collectContributionIssues(issues);

  return qualifyingIssues.reduce(
    (total, issue) => total + resolveIssueDeliveredTotal(issue),
    0
  );
}

/**
 * Business Contribution Engine
 * ============================
 *
 * Measures planned engineering value delivered to the business.
 *
 * This is an informational metric — it does not reduce Engineering Score,
 * Execution Efficiency, Delivery Quality, or Recovery.
 *
 * Pipeline:
 * 1. Collect completed feature engineering issues (exclude QA / UAT bugs).
 * 2. Resolve estimates (Original Estimate or Technology Estimate for CR / RE).
 * 3. Allocate contribution proportionally by developer worklog distribution.
 * 4. contributionPercentage = developerHours / totalHours × 100
 *
 * Actual worklog hours are never used as delivered value — only allocated estimates.
 */
export function calculateContribution(
  input: ContributionInput
): ContributionResult {
  const { developer, issues } = input;

  const { deliveredEngineeringHours, completedTasks } =
    calculateDeveloperDeliveredHours(issues, developer);
  const totalDeliveredHours = calculateTotalDeliveredHours(issues);

  const contributionPercentage = calculateContributionPercentage(
    deliveredEngineeringHours,
    totalDeliveredHours
  );

  return {
    resolved: true,
    deliveredEngineeringHours,
    contributionPercentage,
    completedTasks,
  };
}
