"use client";

import Link from "next/link";

import { SparklineChart } from "@/components/dashboard/sparkline-chart";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  dashboardCard,
  dashboardCardContent,
  dashboardCardHeader,
  dashboardGridGap,
  dashboardTypography,
} from "@/lib/dashboard-ui";
import type { ExplorerTechnologyListItem } from "@/services/analytics-read/explorer";
import type { MetricStatus } from "@/types/dashboard";
import { cn } from "@/lib/utils";

function toMetricStatus(status: string): MetricStatus {
  switch (status) {
    case "Healthy":
      return "healthy";
    case "Stable":
      return "on-track";
    case "Monitor":
      return "neutral";
    case "Critical":
      return "attention";
    default:
      return "neutral";
  }
}

function formatNum(value: number | null, suffix = ""): string {
  if (value === null) {
    return "—";
  }
  const text = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${text}${suffix}`;
}

interface ExplorerTechnologyCardsProps {
  technologies: readonly ExplorerTechnologyListItem[];
}

export function ExplorerTechnologyCards({
  technologies,
}: ExplorerTechnologyCardsProps) {
  if (technologies.length === 0) {
    return (
      <p className="py-8 text-center text-[13px] text-muted-foreground">
        No technologies in the completed Analytics Snapshot.
      </p>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 ${dashboardGridGap}`}>
      {technologies.map((tech) => (
        <Link
          key={tech.id}
          href={`/explorer/technologies/${encodeURIComponent(tech.id)}`}
          className="block transition-transform hover:-translate-y-0.5"
        >
          <Card className={cn(dashboardCard, "h-full")}>
            <CardHeader className={dashboardCardHeader}>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className={dashboardTypography.cardTitle}>
                  {tech.name}
                </CardTitle>
                <StatusBadge
                  status={toMetricStatus(tech.status)}
                  label={tech.statusLabel}
                />
              </div>
              <p className={dashboardTypography.description}>
                Engineering Health {formatNum(tech.engineeringHealth)}
              </p>
            </CardHeader>
            <CardContent className={cn(dashboardCardContent, "space-y-3")}>
              <SparklineChart
                data={tech.trend.length > 0 ? tech.trend : tech.engineeringHealth != null ? [tech.engineeringHealth] : []}
                color="var(--chart-1)"
                height={36}
              />
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <div>
                  <p className={dashboardTypography.label}>Value Delivered</p>
                  <p className="mt-1 font-medium tabular-nums">
                    {formatNum(tech.engineeringValueDeliveredHours, "h")}
                  </p>
                </div>
                <div>
                  <p className={dashboardTypography.label}>Recovery</p>
                  <p className="mt-1 font-medium tabular-nums">
                    {formatNum(tech.recoveryHours, "h")}
                  </p>
                </div>
                <div>
                  <p className={dashboardTypography.label}>Capacity</p>
                  <p className="mt-1 font-medium tabular-nums">
                    {formatNum(tech.capacity)}
                  </p>
                </div>
                <div>
                  <p className={dashboardTypography.label}>Efficiency</p>
                  <p className="mt-1 font-medium tabular-nums">
                    {formatNum(tech.deliveryEfficiency)}
                  </p>
                </div>
              </div>
              <div>
                <p className={dashboardTypography.label}>Top Contributors</p>
                <p className="mt-1 text-[12px] text-foreground">
                  {tech.topContributors.length > 0
                    ? tech.topContributors.join(", ")
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
