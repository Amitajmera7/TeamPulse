/**
 * Formats and assembles the Runtime Verification Report.
 */

import type {
  VerificationReport,
  VerificationSection,
  VerificationStatus,
} from "./types";

function formatCheckLine(
  sectionName: string,
  check: VerificationSection["checks"][number]
): string {
  if (sectionName === "Jira" && check.expected == null) {
    return `${check.actual} ${check.label}`;
  }

  const mark = check.passed ? "✓" : "✗";
  if (check.expected == null) {
    return `${check.label} ${check.actual} ${mark}`;
  }

  return `${check.actual} ${check.label} ${mark}`;
}

/**
 * Builds the human-readable Verification Report block.
 */
export function formatVerificationSummary(
  status: VerificationStatus,
  sections: readonly VerificationSection[]
): string {
  const lines: string[] = ["Verification Report", "", status, ""];

  for (const section of sections) {
    lines.push(section.name);
    lines.push("");
    for (const check of section.checks) {
      // Keep Jira baseline compact like the example (Issues / Worklogs first).
      if (section.name === "Jira") {
        if (check.label === "Issues" || check.label === "Worklogs") {
          lines.push(`${check.actual} ${check.label}`);
          lines.push("");
        }
        continue;
      }

      if (
        section.name === "EAW" &&
        (check.label === "Issues" || check.label === "Worklogs")
      ) {
        lines.push(
          `${check.actual} ${check.label} ${check.passed ? "✓" : "✗"}`
        );
        lines.push("");
        continue;
      }

      if (
        section.name === "Analytics" &&
        (check.label === "Developer Totals" ||
          check.label === "Technology Totals" ||
          check.label === "Engineering Score Inputs")
      ) {
        lines.push(`${check.label} ${check.passed ? "✓" : "✗"}`);
        lines.push("");
        continue;
      }

      if (
        section.name === "Dashboard" &&
        (check.label === "Engineering Score" ||
          check.label === "Top Contributors")
      ) {
        lines.push(`${check.label} ${check.passed ? "✓" : "✗"}`);
        lines.push("");
        continue;
      }
    }
  }

  lines.push("Overall");
  lines.push("");
  lines.push(status);

  return lines.join("\n");
}

/**
 * Assembles the structured report from sections.
 */
export function buildVerificationReport(
  sections: readonly VerificationSection[]
): VerificationReport {
  const status: VerificationStatus = sections.every((section) => section.passed)
    ? "PASS"
    : "FAIL";

  return {
    status,
    sections,
    summary: formatVerificationSummary(status, sections),
    generatedAt: new Date().toISOString(),
  };
}

/** Exported for detailed dumps / debugging. */
export function formatDetailedVerificationReport(
  report: VerificationReport
): string {
  const lines: string[] = [
    "Verification Report (Detailed)",
    "",
    report.status,
    "",
  ];

  for (const section of report.sections) {
    lines.push(section.name);
    lines.push("");
    for (const check of section.checks) {
      lines.push(formatCheckLine(section.name, check));
      if (check.detail) {
        lines.push(`  ${check.detail}`);
      }
      lines.push("");
    }
  }

  lines.push("Overall");
  lines.push("");
  lines.push(report.status);
  return lines.join("\n");
}
