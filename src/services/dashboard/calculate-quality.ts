import { TYPES } from "@/config/jira-fields";
import { ELIGIBLE_DEVELOPERS } from "@/config/eligible-developers";
import { buildDeveloperMetrics } from "@/services/metrics/build-developer-metrics";

import type { ApiDeveloperMetric } from "./types";
import { getLastMonths, isEligibleDeveloper, monthKey, padSparkline } from "./utils";

const BUG_TYPES = new Set([TYPES.QA_BUG, TYPES.UAT_BUG]);

function getIssueType(issue: unknown): string | undefined {
  const typed = issue as {
    fields?: { customfield_10132?: { value?: string } | string };
  };
  const field = typed.fields?.customfield_10132;
  if (typeof field === "string") return field;
  return field?.value;
}

function bugHoursForIssues(issues: unknown[]): number {
  let bugHours = 0;

  for (const issue of issues) {
    if (!BUG_TYPES.has(getIssueType(issue) ?? "")) continue;

    const worklogs =
      (issue as { fields?: { worklog?: { worklogs?: Array<{ author?: { displayName?: string }; timeSpentSeconds?: number }> } } })
        .fields?.worklog?.worklogs ?? [];

    for (const wl of worklogs) {
      if (!isEligibleDeveloper(wl.author?.displayName)) continue;
      bugHours += (wl.timeSpentSeconds ?? 0) / 3600;
    }
  }

  return bugHours;
}

function estimateAdherenceScore(metrics: ApiDeveloperMetric[]): number {
  const active = metrics.filter((m) => m.actualHours > 0);
  if (active.length === 0) return 0;

  const adherence = active.reduce((sum, m) => {
    const ratio = m.estimatedHours / m.actualHours;
    const score =
      ratio >= 0.75 && ratio <= 1.25
        ? 100
        : Math.max(0, 100 - Math.abs(1 - ratio) * 80);
    return sum + score;
  }, 0);

  return Math.round(adherence / active.length);
}

export function qualityForIssues(
  issues: unknown[],
  metrics: ApiDeveloperMetric[]
): number {
  const totalHours = metrics.reduce((sum, m) => sum + m.actualHours, 0);
  const bugHours = bugHoursForIssues(issues);
  const adherence = estimateAdherenceScore(metrics);

  if (totalHours === 0) {
    return adherence;
  }

  const bugPenalty = Math.min(100, Math.round((bugHours / totalHours) * 200));
  const bugFreeScore = Math.max(0, 100 - bugPenalty);

  return Math.round(bugFreeScore * 0.6 + adherence * 0.4);
}

export async function calculateQualityMetrics(
  issues: unknown[],
  metrics: ApiDeveloperMetric[]
): Promise<{ quality: number; qualitySparkline: number[] }> {
  const months = getLastMonths(7);
  const monthKeys = months.map((m) => monthKey(m));

  const byMonth = await Promise.all(
    monthKeys.map(async (key) => {
      const monthIssues = issues.filter((issue) => {
        const updated = (issue as { fields?: { updated?: string } }).fields?.updated;
        return updated && monthKey(new Date(updated)) === key;
      });
      const { metrics: monthMetrics } = await buildDeveloperMetrics(monthIssues);
      return qualityForIssues(monthIssues, monthMetrics);
    })
  );

  return {
    quality: qualityForIssues(issues, metrics),
    qualitySparkline: padSparkline(byMonth),
  };
}
