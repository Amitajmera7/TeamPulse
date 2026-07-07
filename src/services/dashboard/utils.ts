import { format, endOfMonth, startOfMonth, subMonths } from "date-fns";

import { DELIVERED_STATUSES } from "@/config/delivered-statuses";
import { ELIGIBLE_DEVELOPERS } from "@/config/eligible-developers";
import type { MetricStatus, TrendDirection } from "@/types/dashboard";

export const TECH_CHART_COLORS: Record<string, string> = {
  magento: "var(--chart-1)",
  react: "var(--chart-2)",
  html: "var(--chart-4)",
  dt: "var(--chart-3)",
};

export const TECH_NAME_TO_ID: Record<string, string> = {
  Magento: "magento",
  "React JS": "react",
  HTML: "html",
  DT: "dt",
};

export function getInitials(name: string): string {
  return name
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function isDeliveredStatus(status: string | undefined): boolean {
  return DELIVERED_STATUSES.includes(status ?? "");
}

export function isEligibleDeveloper(name: string | undefined): boolean {
  return !!name && ELIGIBLE_DEVELOPERS.includes(name);
}

export function getLastMonths(count: number): Date[] {
  const now = new Date();
  return Array.from({ length: count }, (_, index) =>
    startOfMonth(subMonths(now, count - 1 - index))
  );
}

export function formatMonthLabel(date: Date): string {
  return format(date, "MMM");
}

export function monthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

export function parseMonthKey(key: string): Date {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

export function statusFromPercent(value: number): {
  status: MetricStatus;
  label: string;
} {
  if (value >= 90) {
    return { status: "healthy", label: "Healthy" };
  }
  if (value >= 75) {
    return { status: "on-track", label: "On Track" };
  }
  if (value >= 60) {
    return { status: "neutral", label: "Stable" };
  }
  return { status: "attention", label: "Monitor" };
}

export function statusFromRisk(count: number): {
  status: MetricStatus;
  label: string;
} {
  if (count <= 2) {
    return { status: "healthy", label: "Healthy" };
  }
  if (count <= 5) {
    return { status: "on-track", label: "On Track" };
  }
  return { status: "attention", label: "Monitor" };
}

export function scoreStatusLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "On Track";
  if (score >= 55) return "Monitor";
  return "Needs Attention";
}

export function trendFromDelta(
  current: number,
  previous: number
): { trend: TrendDirection; label: string } {
  const delta = current - previous;
  if (Math.abs(delta) < 1) {
    return { trend: "neutral", label: "→ vs last month" };
  }
  const sign = delta > 0 ? "+" : "";
  return {
    trend: delta > 0 ? "up" : "down",
    label: `${sign}${Math.round(delta)}% vs last month`,
  };
}

export function riskTrendLabel(count: number): {
  trend: TrendDirection;
  label: string;
} {
  return { trend: "neutral", label: `→ ${count} open risk${count === 1 ? "" : "s"}` };
}

export function utilizationHealthScore(utilization: number): number {
  if (utilization >= 75 && utilization <= 95) {
    return 100;
  }
  if (utilization > 95) {
    return Math.max(0, 100 - (utilization - 95) * 4);
  }
  return Math.max(0, utilization * (100 / 75));
}

export function riskHealthScore(riskCount: number): number {
  return Math.max(0, 100 - riskCount * 12);
}

export function getReportingPeriod(): {
  month: string;
  from: string;
  to: string;
} {
  const now = new Date();
  const from = startOfMonth(now);
  const to = endOfMonth(now);

  return {
    month: format(now, "MMMM yyyy"),
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

export function padSparkline(values: number[], length = 7): number[] {
  if (values.length >= length) {
    return values.slice(-length);
  }
  const first = values[0] ?? 0;
  const padding = Array.from(
    { length: length - values.length },
    () => first
  );
  return [...padding, ...values];
}

export function issueHasEligibleWorklog(issue: unknown): boolean {
  const typed = issue as {
    fields?: {
      worklog?: { worklogs?: Array<{ author?: { displayName?: string } }> };
    };
  };
  const worklogs = typed.fields?.worklog?.worklogs ?? [];
  return worklogs.some((wl) => isEligibleDeveloper(wl.author?.displayName));
}
