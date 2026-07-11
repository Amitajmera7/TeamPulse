"use client";

import Link from "next/link";
import {
  Activity,
  Gauge,
  Layers,
  FolderKanban,
  Timer,
  Users,
  Wrench,
} from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { dashboardGridGap } from "@/lib/dashboard-ui";
import type { ExplorerOverview } from "@/services/analytics-read/explorer";

interface ExplorerOverviewCardsProps {
  overview: ExplorerOverview;
}

function formatScore(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatHours(value: number): string {
  return Number.isInteger(value) ? `${value}h` : `${value.toFixed(1)}h`;
}

export function ExplorerOverviewCards({ overview }: ExplorerOverviewCardsProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 ${dashboardGridGap}`}>
      <MetricCard
        title="Developers"
        value={String(overview.developers)}
        icon={Users}
        status="on-track"
        statusLabel="Roster"
        trend="neutral"
        trendLabel="From Analytics Snapshot"
        sparkline={[]}
      />
      <MetricCard
        title="Technologies"
        value={String(overview.technologies)}
        icon={Layers}
        status="on-track"
        statusLabel="Disciplines"
        trend="neutral"
        trendLabel="From Analytics Snapshot"
        sparkline={[]}
      />
      <MetricCard
        title="Projects"
        value={String(overview.projects)}
        icon={FolderKanban}
        status={overview.projects > 0 ? "healthy" : "neutral"}
        statusLabel={overview.projects > 0 ? "EAW facts" : "None"}
        trend="neutral"
        trendLabel="Warehouse project keys"
        sparkline={[]}
      />
      <MetricCard
        title="Engineering Value Delivered"
        value={formatHours(overview.engineeringValueDeliveredHours)}
        icon={Activity}
        status="on-track"
        statusLabel="Hours"
        trend="neutral"
        trendLabel="Delivered Engineering Hours"
        sparkline={[]}
      />
      <MetricCard
        title="Recovery Hours"
        value={formatHours(overview.recoveryHours)}
        icon={Timer}
        status={overview.recoveryHours > 0 ? "attention" : "healthy"}
        statusLabel={overview.recoveryHours > 0 ? "Elevated" : "None"}
        trend="neutral"
        trendLabel="Informational"
        sparkline={[]}
      />
      <MetricCard
        title="Engineering Score"
        value={formatScore(overview.engineeringScore)}
        icon={Gauge}
        status={overview.engineeringScore != null ? "healthy" : "neutral"}
        statusLabel={overview.engineeringScore != null ? "Team" : "No Data"}
        trend="neutral"
        trendLabel="Weighted snapshot score"
        sparkline={[]}
      />
      <MetricCard
        title="Delivery Efficiency"
        value={formatScore(overview.deliveryEfficiency)}
        icon={Wrench}
        status={overview.deliveryEfficiency != null ? "on-track" : "neutral"}
        statusLabel={overview.deliveryEfficiency != null ? "Execution" : "No Data"}
        trend="neutral"
        trendLabel="Weighted execution"
        sparkline={[]}
      />
      <div className="hidden xl:block" aria-hidden />
    </div>
  );
}

export function ExplorerBackLink() {
  return (
    <Link
      href="/explorer"
      className="text-[13px] font-medium text-primary hover:underline"
    >
      ← Back to Explorer
    </Link>
  );
}
