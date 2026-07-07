import { buildDeveloperMetrics } from "@/services/metrics/build-developer-metrics";

import {
  formatMonthLabel,
  getLastMonths,
  isDeliveredStatus,
  isEligibleDeveloper,
  monthKey,
} from "./utils";

export async function calculateTrends(issues: unknown[]) {
  const months = getLastMonths(7);
  const monthKeys = months.map((m) => monthKey(m));
  const labels = months.map(formatMonthLabel);

  const deliveryData = monthKeys.map((key, index) => {
    const count = issues.filter((issue) => {
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
      return worklogs.some((wl) =>
        isEligibleDeveloper(wl.author?.displayName)
      );
    }).length;

    return { month: labels[index], value: count };
  });

  const productivityData = await Promise.all(
    monthKeys.map(async (key, index) => {
      const monthIssues = issues.filter((issue) => {
        const typed = issue as { fields?: { updated?: string } };
        return monthKey(new Date(typed.fields?.updated ?? "")) === key;
      });

      const { metrics } = await buildDeveloperMetrics(monthIssues);
      const active = metrics.filter((m) => m.actualHours > 0);
      const avg =
        active.length > 0
          ? Math.round(
              active.reduce((sum, m) => sum + m.efficiency, 0) / active.length
            )
          : 0;

      return { month: labels[index], value: avg };
    })
  );

  return {
    deliveryTrend: {
      title: "Delivery Trend",
      description: "Stories and subtasks completed over time",
      dropdown: "Stories",
      data: deliveryData,
    },
    productivityTrend: {
      title: "Productivity Trend",
      description: "Output relative to engineering capacity",
      dropdown: "Productivity",
      data: productivityData,
    },
  };
}
