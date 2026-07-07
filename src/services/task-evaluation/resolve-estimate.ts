import type { JiraIssueInput, ResolvedEstimate } from "./types";

/**
 * Resolves the engineering estimate for a task and developer.
 *
 * TODO: Implement using src/config/estimate-fields.ts.
 * TODO: Resolve CR/RE multi-technology estimates via developer technology mapping.
 * TODO: Read standard feature estimates from Jira original estimate fields.
 */
export function resolveEstimate(
  issue: JiraIssueInput,
  developer: string
): ResolvedEstimate {
  void issue;

  return {
    issueKey: issue.key ?? "",
    developer,
    technology: "",
    issueType: "",
    estimateHours: 0,
    estimateSource: "unresolved",
  };
}
