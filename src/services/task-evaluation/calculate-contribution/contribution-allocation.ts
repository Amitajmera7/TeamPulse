import { resolveAllocationDenominatorHours } from "../allocation-context";
import { allocateEstimateHours } from "../allocate-estimate";
import { readRawWorklogs } from "../parse-worklogs";
import { resolveEstimate } from "../resolve-estimate";
import { resolveWorklogs } from "../resolve-worklogs";
import { collectWorklogSources } from "../worklog-sources";
import type { JiraIssueInput, ResolvedEstimate } from "../types";

/**
 * Reads the first developer displayName found on engineering worklogs.
 *
 * Used to resolve CR / RE technology estimates for scope-wide totals.
 */
export function readFirstWorklogDeveloper(
  issue: JiraIssueInput
): string | null {
  const sources = collectWorklogSources(issue);

  for (const source of sources) {
    for (const entry of readRawWorklogs(source)) {
      const developer = entry.author?.displayName;
      if (developer) {
        return developer;
      }
    }
  }

  return null;
}

/**
 * Resolves the full issue estimate used for scope-wide delivered totals.
 *
 * Standard feature work uses Original Estimate.
 * CR / RE work uses the technology estimate resolved from the first worklog author.
 */
export function resolveIssueEstimateForTotal(
  issue: JiraIssueInput
): ResolvedEstimate {
  const referenceDeveloper = readFirstWorklogDeveloper(issue) ?? "";
  return resolveEstimate(issue, referenceDeveloper);
}

/**
 * Allocates contribution hours to a developer on a single issue.
 *
 * Uses allocated engineering estimates — actual worklog hours are used only
 * to determine proportional share, never as delivered value directly.
 *
 * Standard work:
 *   allocated = originalEstimate × (developerHours / totalSubtaskHours)
 *
 * CR / RE work:
 *   allocated = technologyEstimate × (developerHours / totalTechnologyHours)
 */
export function allocateContributionHours(
  issue: JiraIssueInput,
  developer: string
): number {
  const estimate = resolveEstimate(issue, developer);

  if (!estimate.resolved) {
    return 0;
  }

  const worklogs = resolveWorklogs(issue, developer);

  if (!worklogs.resolved) {
    return 0;
  }

  const denominatorHours = resolveAllocationDenominatorHours(issue, estimate);
  const allocated = allocateEstimateHours({
    estimateHours: estimate.hours,
    developerHours: worklogs.actualHours,
    denominatorHours,
  });

  return allocated ?? 0;
}

/**
 * Resolves total delivered engineering hours for a single completed issue.
 *
 * When allocation is valid, proportional shares sum to the full resolved estimate.
 */
export function resolveIssueDeliveredTotal(issue: JiraIssueInput): number {
  const estimate = resolveIssueEstimateForTotal(issue);

  if (!estimate.resolved) {
    return 0;
  }

  const denominatorHours = resolveAllocationDenominatorHours(issue, estimate);

  if (denominatorHours <= 0) {
    return 0;
  }

  return estimate.hours;
}
