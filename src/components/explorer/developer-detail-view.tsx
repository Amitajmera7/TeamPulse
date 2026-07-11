"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ExplorerBackLink } from "@/components/explorer/explorer-overview-cards";
import { SparklineChart } from "@/components/dashboard/sparkline-chart";
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
  dashboardSectionSpacing,
  dashboardTypography,
} from "@/lib/dashboard-ui";
import type { ExplorerDeveloperDetail } from "@/services/analytics-read/explorer";
import { TECH_NAME_TO_ID } from "@/services/dashboard/utils";

function formatNum(value: number | null, suffix = ""): string {
  if (value === null) {
    return "—";
  }
  const text = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${text}${suffix}`;
}

function technologyHref(technology: string): string {
  const id =
    TECH_NAME_TO_ID[technology] ??
    technology.toLowerCase().replace(/\s+/g, "-");
  return `/explorer/technologies/${encodeURIComponent(id)}`;
}

interface DeveloperDetailViewProps {
  id: string;
}

export function DeveloperDetailView({ id }: DeveloperDetailViewProps) {
  const [detail, setDetail] = useState<ExplorerDeveloperDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(
          `/api/explorer/developers/${encodeURIComponent(id)}`,
          { cache: "no-store" }
        );
        const payload = (await response.json()) as ExplorerDeveloperDetail & {
          success?: boolean;
          error?: string;
        };
        if (!response.ok || payload.success === false) {
          if (!cancelled) {
            setError(payload.error ?? "Developer not found.");
          }
          return;
        }
        if (!cancelled) {
          setDetail(payload);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load.");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const developer = detail?.developer;

  return (
    <div className={dashboardSectionSpacing}>
      <ExplorerBackLink />
      <div>
        <h1 className={dashboardTypography.sectionTitle}>
          {developer?.name ?? "Developer Detail"}
        </h1>
        <p className={dashboardTypography.sectionDescription}>
          {developer?.technology || "Technology unknown"}
          {detail?.reportingPeriod.month
            ? ` · ${detail.reportingPeriod.month}`
            : ""}
        </p>
      </div>

      {error ? <p className="text-[13px] text-destructive">{error}</p> : null}

      {developer ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className={dashboardCard}>
            <CardHeader className={dashboardCardHeader}>
              <CardTitle className={dashboardTypography.cardTitle}>
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent
              className={`${dashboardCardContent} grid grid-cols-2 gap-3 text-[13px]`}
            >
              <div>
                <p className={dashboardTypography.label}>Engineering Score</p>
                <p className="mt-1 font-semibold tabular-nums">
                  {formatNum(developer.engineeringScore)}
                </p>
              </div>
              <div>
                <p className={dashboardTypography.label}>Status</p>
                <p className="mt-1 font-medium">{developer.status}</p>
              </div>
              <div>
                <p className={dashboardTypography.label}>
                  Engineering Value Delivered
                </p>
                <p className="mt-1 font-medium tabular-nums">
                  {formatNum(developer.deliveredHours, "h")}
                </p>
              </div>
              <div>
                <p className={dashboardTypography.label}>Recovery Hours</p>
                <p className="mt-1 font-medium tabular-nums">
                  {formatNum(developer.recoveryHours, "h")}
                </p>
              </div>
              <div>
                <p className={dashboardTypography.label}>Capacity</p>
                <p className="mt-1 font-medium tabular-nums">
                  {formatNum(developer.capacityUtilization)}
                </p>
              </div>
              <div>
                <p className={dashboardTypography.label}>Delivery Efficiency</p>
                <p className="mt-1 font-medium tabular-nums">
                  {formatNum(developer.deliveryEfficiency)}
                </p>
              </div>
              <div>
                <p className={dashboardTypography.label}>Completed Tasks</p>
                <p className="mt-1 font-medium tabular-nums">
                  {detail?.completedTasks ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className={dashboardCard}>
            <CardHeader className={dashboardCardHeader}>
              <CardTitle className={dashboardTypography.cardTitle}>
                Score Components & Trend
              </CardTitle>
            </CardHeader>
            <CardContent className={`${dashboardCardContent} space-y-4`}>
              <div className="grid grid-cols-3 gap-3 text-[13px]">
                <div>
                  <p className={dashboardTypography.label}>Execution</p>
                  <p className="mt-1 font-medium tabular-nums">
                    {formatNum(detail?.scoreComponents.execution ?? null)}
                  </p>
                </div>
                <div>
                  <p className={dashboardTypography.label}>Quality</p>
                  <p className="mt-1 font-medium tabular-nums">
                    {formatNum(detail?.scoreComponents.quality ?? null)}
                  </p>
                </div>
                <div>
                  <p className={dashboardTypography.label}>Contribution</p>
                  <p className="mt-1 font-medium tabular-nums">
                    {formatNum(detail?.scoreComponents.contribution ?? null)}
                  </p>
                </div>
              </div>
              <SparklineChart
                data={developer.trend}
                color="var(--chart-2)"
                height={48}
              />
              {developer.technology ? (
                <Link
                  href={technologyHref(developer.technology)}
                  className="text-[13px] font-medium text-primary hover:underline"
                >
                  View technology →
                </Link>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
