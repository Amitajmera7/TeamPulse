import {
  classifyRecoveryBugType,
  collectRecoveryBugs,
  sumDeveloperBugRecoveryHours,
  sumBugRecoveryHours,
} from "./bug-worklog-sources";
import type { JiraIssueInput } from "../types";
import type { RecoveryHoursBreakdown } from "./types";

/**
 * Calculates recovery hours for a developer across QA / UAT bugs.
 *
 * Work is attributed to the developer who logged the worklog.
 * No proportional allocation is applied.
 */
export function calculateDeveloperRecoveryHours(
  linkedBugs: JiraIssueInput[],
  developer: string
): RecoveryHoursBreakdown {
  const bugs = collectRecoveryBugs(linkedBugs);

  let qaRecoveryHours = 0;
  let uatRecoveryHours = 0;
  let qaBugCount = 0;
  let uatBugCount = 0;

  for (const bug of bugs) {
    const bugType = classifyRecoveryBugType(bug);
    if (!bugType) {
      continue;
    }

    const developerHours = sumDeveloperBugRecoveryHours(bug, developer);

    if (bugType === "QA Bug") {
      qaBugCount += 1;
      qaRecoveryHours += developerHours;
    } else {
      uatBugCount += 1;
      uatRecoveryHours += developerHours;
    }
  }

  return {
    qaRecoveryHours,
    uatRecoveryHours,
    totalRecoveryHours: qaRecoveryHours + uatRecoveryHours,
    qaBugCount,
    uatBugCount,
  };
}

/**
 * Calculates total recovery hours logged on QA / UAT bugs by all developers.
 */
export function calculateTotalRecoveryHours(
  linkedBugs: JiraIssueInput[]
): number {
  const bugs = collectRecoveryBugs(linkedBugs);

  return bugs.reduce(
    (total, bug) => total + sumBugRecoveryHours(bug),
    0
  );
}
