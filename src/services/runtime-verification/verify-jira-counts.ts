/**
 * Jira-layer counts from the live BannerBuzz issue payload.
 */

import { ELIGIBLE_DEVELOPERS } from "@/config/eligible-developers";
import { getTechByDeveloper } from "@/services/metrics/get-tech-by-developer";
import type { JiraIssueInput } from "@/services/task-evaluation/task-evaluation";

import { countCheck, sectionFromChecks, type VerificationSection } from "./types";

const ELIGIBLE = new Set(ELIGIBLE_DEVELOPERS);

export interface JiraCountSnapshot {
  readonly issueCount: number;
  readonly worklogCount: number;
  readonly eligibleWorklogCount: number;
  readonly developerCount: number;
  readonly technologyCount: number;
  readonly engineeringHours: number;
  readonly eligibleEngineeringHours: number;
}

function readRawWorklogs(issue: JiraIssueInput): Array<{
  author?: string;
  hours: number;
}> {
  const worklogField = issue.fields?.worklog as
    | {
        worklogs?: Array<{
          author?: { displayName?: string };
          timeSpentSeconds?: number;
        }>;
      }
    | undefined;

  const entries = worklogField?.worklogs ?? [];
  return entries.map((entry) => ({
    author: entry.author?.displayName,
    hours: (entry.timeSpentSeconds ?? 0) / 3600,
  }));
}

/**
 * Collects factual Jira counts (no analytics formulas).
 */
export function collectJiraCounts(
  issues: readonly JiraIssueInput[]
): JiraCountSnapshot {
  let worklogCount = 0;
  let eligibleWorklogCount = 0;
  let engineeringHours = 0;
  let eligibleEngineeringHours = 0;
  const developers = new Set<string>();
  const technologies = new Set<string>();

  for (const issue of issues) {
    for (const entry of readRawWorklogs(issue)) {
      worklogCount += 1;
      engineeringHours += entry.hours;

      if (entry.author && ELIGIBLE.has(entry.author) && entry.hours > 0) {
        eligibleWorklogCount += 1;
        eligibleEngineeringHours += entry.hours;
        developers.add(entry.author);
        const tech = getTechByDeveloper(entry.author);
        if (tech) {
          technologies.add(tech);
        }
      }
    }
  }

  return {
    issueCount: issues.length,
    worklogCount,
    eligibleWorklogCount,
    developerCount: developers.size,
    technologyCount: technologies.size,
    engineeringHours,
    eligibleEngineeringHours,
  };
}

/**
 * Builds the Jira verification section (informational baseline counts).
 */
export function verifyJiraCounts(
  issues: readonly JiraIssueInput[]
): { section: VerificationSection; snapshot: JiraCountSnapshot } {
  const snapshot = collectJiraCounts(issues);

  const section = sectionFromChecks("Jira", [
    countCheck("Issues", snapshot.issueCount, null),
    countCheck("Worklogs", snapshot.worklogCount, null),
    countCheck("Eligible Worklogs", snapshot.eligibleWorklogCount, null),
    countCheck("Developers", snapshot.developerCount, null),
    countCheck("Technologies", snapshot.technologyCount, null),
    countCheck(
      "Engineering Hours",
      Number(snapshot.engineeringHours.toFixed(4)),
      null,
      "Sum of all Jira worklog hours"
    ),
    countCheck(
      "Eligible Engineering Hours",
      Number(snapshot.eligibleEngineeringHours.toFixed(4)),
      null,
      "Eligible developers with hours > 0"
    ),
  ]);

  return { section, snapshot };
}
