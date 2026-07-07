import { getDeveloperTechnology } from "./resolve-estimate";
import {
  readRawWorklogs,
  secondsToDecimalHours,
} from "./parse-worklogs";
import type { JiraIssueInput, ResolvedEstimate } from "./types";
import { collectWorklogSources } from "./worklog-sources";

/**
 * Sums all worklog hours across engineering worklog sources.
 */
export function sumAllSourceWorklogHours(
  sources: JiraIssueInput[]
): number {
  return sources
    .flatMap((source) => readRawWorklogs(source))
    .reduce(
      (total, entry) =>
        total + secondsToDecimalHours(entry.timeSpentSeconds ?? 0),
      0
    );
}

/**
 * Sums worklog hours attributed to developers in a specific technology.
 */
export function sumTechnologyWorklogHours(
  sources: JiraIssueInput[],
  technology: string
): number {
  return sources
    .flatMap((source) => readRawWorklogs(source))
    .filter((entry) => {
      const developer = entry.author?.displayName;
      if (!developer) {
        return false;
      }
      return getDeveloperTechnology(developer) === technology;
    })
    .reduce(
      (total, entry) =>
        total + secondsToDecimalHours(entry.timeSpentSeconds ?? 0),
      0
    );
}

/**
 * Resolves the allocation denominator hours for execution efficiency.
 *
 * Standard engineering work uses total subtask hours.
 * CR / RE work uses total technology hours for the resolved technology.
 */
export function resolveAllocationDenominatorHours(
  issue: JiraIssueInput,
  estimate: ResolvedEstimate
): number {
  const sources = collectWorklogSources(issue);

  if (
    estimate.source === "technology-estimate-field" &&
    estimate.technology
  ) {
    return sumTechnologyWorklogHours(sources, estimate.technology);
  }

  return sumAllSourceWorklogHours(sources);
}
