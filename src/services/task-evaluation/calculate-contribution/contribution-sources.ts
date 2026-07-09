import { isBugWork, isFeatureWork } from "@/config/issue-types";
import { isDevelopmentComplete } from "@/config/status-mapping";

import { readIssueType } from "../resolve-estimate";
import type { JiraIssueInput } from "../types";

/**
 * Reads the Jira workflow status name from an issue payload.
 */
export function readIssueStatus(issue: JiraIssueInput): string {
  const status = issue.fields?.status as { name?: string } | undefined;
  return status?.name ?? "";
}

/**
 * Returns true when the issue type is planned feature engineering work.
 */
export function isContributionIssueType(issueType: string): boolean {
  return isFeatureWork(issueType);
}

/**
 * Returns true when an issue qualifies for business contribution.
 *
 * Requirements:
 * - Development complete status
 * - Planned feature work (Magento, React JS, HTML, DT, CR, RE)
 * - Not QA Bug or UAT Bug
 */
export function isContributionEligible(issue: JiraIssueInput): boolean {
  const issueType = readIssueType(issue);

  if (isBugWork(issueType)) {
    return false;
  }

  if (!isContributionIssueType(issueType)) {
    return false;
  }

  return isDevelopmentComplete(readIssueStatus(issue));
}

/**
 * Collects completed feature engineering issues that participate in contribution.
 *
 * QA / UAT bugs and incomplete work are excluded.
 */
export function collectContributionIssues(
  issues: JiraIssueInput[]
): JiraIssueInput[] {
  return issues.filter(isContributionEligible);
}
