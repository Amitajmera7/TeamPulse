import { DEVELOPERS } from "@/config/developers";
import { getEstimateField } from "@/config/estimate-fields";
import type { Technology } from "@/config/technologies";
import { TECHNOLOGIES } from "@/config/technologies";

import type { EstimateSource, JiraIssueInput, ResolvedEstimate } from "./types";

const ISSUE_TYPE_FIELD = "customfield_10132";
const ORIGINAL_ESTIMATE_FIELD = "timetracking.originalEstimateSeconds";
const CR_RE_TYPES = new Set(["CR", "RE"]);

/**
 * Reads the TeamPulse issue classification from a Jira issue payload.
 */
export function readIssueType(issue: JiraIssueInput): string {
  const typeField = issue.fields?.[ISSUE_TYPE_FIELD] as
    | { value?: string }
    | string
    | undefined;

  if (typeof typeField === "string") {
    return typeField;
  }

  return typeField?.value ?? "";
}

/**
 * Looks up a developer's assigned technology from organization config.
 *
 * Returns null for unknown or inactive developers.
 */
export function getDeveloperTechnology(
  developer: string
): Technology | null {
  const match = DEVELOPERS.find(
    (entry) => entry.active && entry.name === developer
  );

  return match?.technology ?? null;
}

function isStandardFeatureIssueType(issueType: string): boolean {
  return TECHNOLOGIES.includes(issueType as Technology);
}

function readNumericField(
  issue: JiraIssueInput,
  fieldPath: string
): number | null {
  const value = readFieldValue(issue, fieldPath);
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function readFieldValue(
  issue: JiraIssueInput,
  fieldPath: string
): unknown {
  if (fieldPath === ORIGINAL_ESTIMATE_FIELD) {
    const timetracking = issue.fields?.timetracking as
      | { originalEstimateSeconds?: number }
      | undefined;
    return timetracking?.originalEstimateSeconds;
  }

  return issue.fields?.[fieldPath];
}

function secondsToHours(seconds: number): number {
  return seconds / 3600;
}

function unresolved(
  source: EstimateSource,
  field: string
): ResolvedEstimate {
  return {
    hours: 0,
    source,
    field,
    resolved: false,
  };
}

function resolvedEstimate(
  hours: number,
  source: EstimateSource,
  field: string,
  technology?: string
): ResolvedEstimate {
  return {
    hours,
    source,
    field,
    resolved: true,
    ...(technology ? { technology } : {}),
  };
}

/**
 * Resolves the Jira Original Estimate for standard feature issue types.
 */
function resolveOriginalEstimate(
  issue: JiraIssueInput
): ResolvedEstimate {
  const seconds = readNumericField(issue, ORIGINAL_ESTIMATE_FIELD);

  if (seconds === null || seconds <= 0) {
    return unresolved("missing-estimate", ORIGINAL_ESTIMATE_FIELD);
  }

  return resolvedEstimate(
    secondsToHours(seconds),
    "jira-original-estimate",
    ORIGINAL_ESTIMATE_FIELD
  );
}

/**
 * Resolves a technology-specific estimate for CR / RE issues.
 */
function resolveCrReEstimate(
  issue: JiraIssueInput,
  developer: string
): ResolvedEstimate {
  const technology = getDeveloperTechnology(developer);

  if (!technology) {
    return unresolved("unknown-developer", "");
  }

  const field = getEstimateField(technology);
  const hours = readNumericField(issue, field);

  if (hours === null || hours <= 0) {
    return unresolved("missing-estimate", field);
  }

  return resolvedEstimate(hours, "technology-estimate-field", field, technology);
}

/**
 * Resolves the engineering estimate for a task and developer.
 *
 * Standard feature work (Magento, React JS, HTML, DT) uses Jira Original
 * Estimate. CR / RE work uses the technology-specific estimate field mapped
 * to the developer via organization config.
 *
 * Unknown developers and missing estimates never produce invented values.
 */
export function resolveEstimate(
  issue: JiraIssueInput,
  developer: string
): ResolvedEstimate {
  const issueType = readIssueType(issue);

  if (isStandardFeatureIssueType(issueType)) {
    return resolveOriginalEstimate(issue);
  }

  if (CR_RE_TYPES.has(issueType)) {
    return resolveCrReEstimate(issue, developer);
  }

  return unresolved("unsupported-issue-type", ISSUE_TYPE_FIELD);
}
