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

function deliveryRateForTeam(
  issues: unknown[],
  techName: string
): number {
  const teamIssues = issues.filter((issue) => {
    if (!issueHasEligibleTeamWorklog(issue, techName)) return false;
    return true;
  });

  if (teamIssues.length === 0) return 0;

  const delivered = teamIssues.filter((issue) => {
    const typed = issue as { fields?: { status?: { name?: string } } };
    return isDeliveredStatus(typed.fields?.status?.name);
  }).length;

  return Math.round((delivered / teamIssues.length) * 100);
}

function issueHasEligibleTeamWorklog(
  issue: unknown,
  techName: string
): boolean {
  const worklogs =
    (issue as {
      fields?: {
        worklog?: {
          worklogs?: Array<{ author?: { displayName?: string } }>;
        };
      };
    }).fields?.worklog?.worklogs ?? [];

  return worklogs.some((wl) => {
    const dev = wl.author?.displayName;
    if (!isEligibleDeveloper(dev)) return false;
    return getTechByDeveloper(dev!) === techName;
  });
}

function compositeTechHealth(input: {
  deliveryRate: number;
  productivity: number;
  contribution: number;
  participation: number;
}): number {
  return Math.round(
    input.deliveryRate * 0.35 +
      input.productivity * 0.3 +
      input.contribution * 0.2 +
      input.participation * 0.15
  );
}

function aggregateTechMetrics(
  metrics: ApiDeveloperMetric[],
  contribution: ApiContributionMetric[],
  issues: unknown[]
): TechnologyCardData[] {
  const months = getLastMonths(7);
  const monthKeys = months.map((m) => monthKey(m));

  return Object.keys(TEAM_MAPPING).map((techName) => {
    const id = TECH_NAME_TO_ID[techName] ?? techName.toLowerCase();
    const roster = TEAM_MAPPING[techName as keyof typeof TEAM_MAPPING];
    const teamDevelopers = new Set(roster);

    const techMetrics = metrics.filter(
      (m) => m.technology === techName || teamDevelopers.has(m.developer)
    );

    const techContribution = contribution.filter((c) => {
      const tech = getTechByDeveloper(c.developer);
      return tech === techName;
    });

    const developers = techMetrics.filter((m) => m.actualHours > 0).length;
    const hours = Math.round(
      techMetrics.reduce((sum, m) => sum + m.actualHours, 0)
    );
    const stories = Math.round(
      techContribution.reduce((sum, c) => sum + c.deliveredTickets, 0)
    );

    const productivity =
      techMetrics.length > 0
        ? Math.round(
            techMetrics.reduce((sum, m) => sum + m.efficiency, 0) /
              techMetrics.length
          )
        : 0;

    const totalActual = techMetrics.reduce((sum, m) => sum + m.actualHours, 0);
    const totalDelivered = techContribution.reduce(
      (sum, c) => sum + c.deliveredHours,
      0
    );
    const contributionRate =
      totalActual > 0
        ? Math.min(100, Math.round((totalDelivered / totalActual) * 100))
        : 0;

    const participation =
      roster.length > 0
        ? Math.round((developers / roster.length) * 100)
        : 0;

    const deliveryRate = deliveryRateForTeam(issues, techName);

    const healthScore = compositeTechHealth({
      deliveryRate,
      productivity,
      contribution: contributionRate,
      participation,
    });

    const sparkline = padSparkline(
      monthKeys.map((key) => {
        return issues.filter((issue) => {
          const typed = issue as {
            fields?: {
              updated?: string;
              status?: { name?: string };
            };
          };

          if (monthKey(new Date(typed.fields?.updated ?? "")) !== key) {
            return false;
          }
          if (!isDeliveredStatus(typed.fields?.status?.name)) {
            return false;
          }

          return issueHasEligibleTeamWorklog(issue, techName);
        }).length;
      })
    );

    const { status, label } = statusFromPercent(healthScore);

    return {
      id,
      name: techName,
      status,
      statusLabel: label,
      developers,
      hours,
      stories,
      efficiency: productivity,
      sparkline,
      chartColor: TECH_CHART_COLORS[id] ?? "var(--chart-2)",
      healthScore,
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
