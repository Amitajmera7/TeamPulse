import type {
  ApiContributionMetric,
  ApiDeveloperMetric,
  ContributorRow,
} from "./types";
import { getInitials } from "./utils";

export function calculateLeaderboard(
  metrics: ApiDeveloperMetric[],
  contribution: ApiContributionMetric[],
  limit = 5
): ContributorRow[] {
  const contributionByDev = new Map(
    contribution.map((c) => [c.developer, c])
  );

  const merged = metrics.map((metric) => {
    const contrib = contributionByDev.get(metric.developer);
    return {
      name: metric.developer,
      initials: getInitials(metric.developer),
      stories: Math.round(contrib?.deliveredTickets ?? 0),
      hours: Math.round(metric.actualHours),
      efficiency: Math.round(metric.efficiency),
      deliveredHours: contrib?.deliveredHours ?? 0,
    };
  });

  const sorted = merged
    .filter((row) => row.hours > 0 || row.stories > 0)
    .sort((a, b) => {
      if (b.deliveredHours !== a.deliveredHours) {
        return b.deliveredHours - a.deliveredHours;
      }
      return b.efficiency - a.efficiency;
    })
    .slice(0, limit);

  const storiesMax = Math.max(...sorted.map((r) => r.stories), 1);
  const hoursMax = Math.max(...sorted.map((r) => r.hours), 1);

  return sorted.map(({ deliveredHours: _, ...row }) => ({
    ...row,
    storiesMax,
    hoursMax,
  }));
}
