import { TEAM_MAPPING } from "@/config/team-mapping";
import { getTechByDeveloper } from "@/services/metrics/get-tech-by-developer";

import type {
  ApiContributionMetric,
  ApiDeveloperMetric,
  TechnologyCardData,
} from "./types";
import {
  formatMonthLabel,
  getLastMonths,
  isDeliveredStatus,
  isEligibleDeveloper,
  monthKey,
  padSparkline,
  statusFromPercent,
  TECH_CHART_COLORS,
  TECH_NAME_TO_ID,
} from "./utils";

function aggregateTechMetrics(
  metrics: ApiDeveloperMetric[],
  contribution: ApiContributionMetric[],
  issues: unknown[]
): TechnologyCardData[] {
  const months = getLastMonths(7);
  const monthKeys = months.map((m) => monthKey(m));

  return Object.keys(TEAM_MAPPING).map((techName) => {
    const id = TECH_NAME_TO_ID[techName] ?? techName.toLowerCase();
    const teamDevelopers = new Set(TEAM_MAPPING[techName as keyof typeof TEAM_MAPPING]);

    const techMetrics = metrics.filter(
      (m) => m.technology === techName || teamDevelopers.has(m.developer)
    );

    const techContribution = contribution.filter((c) => {
      const tech = getTechByDeveloper(c.developer);
      return tech === techName;
    });

    const developers = techMetrics.length;
    const hours = Math.round(
      techMetrics.reduce((sum, m) => sum + m.actualHours, 0)
    );
    const stories = Math.round(
      techContribution.reduce((sum, c) => sum + c.deliveredTickets, 0)
    );

    const avgEfficiency =
      techMetrics.length > 0
        ? techMetrics.reduce((sum, m) => sum + m.efficiency, 0) /
          techMetrics.length
        : 0;

    const sparkline = padSparkline(
      monthKeys.map((key) => {
        return issues.filter((issue) => {
          const typed = issue as {
            fields?: {
              updated?: string;
              status?: { name?: string };
              worklog?: {
                worklogs?: Array<{ author?: { displayName?: string } }>;
              };
            };
          };

          if (monthKey(new Date(typed.fields?.updated ?? "")) !== key) {
            return false;
          }
          if (!isDeliveredStatus(typed.fields?.status?.name)) {
            return false;
          }

          const worklogs = typed.fields?.worklog?.worklogs ?? [];
          return worklogs.some((wl) => {
            const dev = wl.author?.displayName;
            if (!isEligibleDeveloper(dev)) return false;
            return getTechByDeveloper(dev!) === techName;
          });
        }).length;
      })
    );

    const { status, label } = statusFromPercent(Math.round(avgEfficiency));

    return {
      id,
      name: techName,
      status,
      statusLabel: label,
      developers,
      hours,
      stories,
      sparkline,
      chartColor: TECH_CHART_COLORS[id] ?? "var(--chart-2)",
    };
  });
}

export function calculateTechnologyCards(
  metrics: ApiDeveloperMetric[],
  contribution: ApiContributionMetric[],
  issues: unknown[]
): TechnologyCardData[] {
  return aggregateTechMetrics(metrics, contribution, issues);
}

export function getMonthLabels(): string[] {
  return getLastMonths(7).map(formatMonthLabel);
}
