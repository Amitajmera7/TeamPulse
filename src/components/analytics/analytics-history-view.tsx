"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DeliveryTrendCard,
  ProductivityTrendCard,
} from "@/components/dashboard/trend-charts";
import {
  dashboardSectionSpacing,
  dashboardTypography,
  dashboardGridGap,
} from "@/lib/dashboard-ui";
import type { AnalyticsHistoryReadModel } from "@/services/analytics-read";
import type { AnalyticsHistoryMonths } from "@/services/analytics-read";

const TIME_RANGES: AnalyticsHistoryMonths[] = [3, 6, 12];

export function AnalyticsHistoryView() {
  const [months, setMonths] = useState<AnalyticsHistoryMonths>(6);
  const [technology, setTechnology] = useState<string>("");
  const [developer, setDeveloper] = useState<string>("");
  const [model, setModel] = useState<AnalyticsHistoryReadModel | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("months", String(months));
    if (technology) {
      params.set("technology", technology);
    }
    if (developer) {
      params.set("developer", developer);
    }
    return params.toString();
  }, [months, technology, developer]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/analytics/history?${query}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as AnalyticsHistoryReadModel & {
        success?: boolean;
        error?: string;
      };
      if (!response.ok || payload.success === false) {
        setMessage(payload.error ?? `Failed to load (${response.status})`);
        return;
      }
      setModel(payload);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load historical analytics."
      );
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const technologies = model?.meta.filterOptions.technologies ?? [];
  const developers = model?.meta.filterOptions.developers ?? [];

  return (
    <div className={dashboardSectionSpacing}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/analytics">
                <ArrowLeft data-icon="inline-start" />
                Back to Analytics
              </Link>
            </Button>
          </div>
          <h1 className={dashboardTypography.sectionTitle}>
            Historical Engineering Analytics
          </h1>
          <p className={dashboardTypography.sectionDescription}>
            Trends from archived Analytics Snapshots — no formula recalculation
          </p>
        </div>
        {message ? (
          <p className="max-w-xl text-[13px] text-muted-foreground">{message}</p>
        ) : null}
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div>
          <p className={dashboardTypography.label}>Time Range</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TIME_RANGES.map((range) => (
              <Button
                key={range}
                size="sm"
                variant={months === range ? "default" : "outline"}
                onClick={() => setMonths(range)}
              >
                {range} Months
              </Button>
            ))}
          </div>
        </div>
        <div className="min-w-[180px]">
          <p className={dashboardTypography.label}>Technology</p>
          <select
            className="mt-2 h-9 w-full rounded-lg border border-border/70 bg-background px-3 text-[13px]"
            value={technology}
            onChange={(event) => setTechnology(event.target.value)}
            aria-label="Filter by technology"
          >
            <option value="">All Technologies</option>
            {technologies.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[180px]">
          <p className={dashboardTypography.label}>Developer</p>
          <select
            className="mt-2 h-9 w-full rounded-lg border border-border/70 bg-background px-3 text-[13px]"
            value={developer}
            onChange={(event) => setDeveloper(event.target.value)}
            aria-label="Filter by developer"
          >
            <option value="">All Developers</option>
            {developers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {loading && !model ? (
        <p className="text-[13px] text-muted-foreground">Loading trends…</p>
      ) : null}

      {model ? (
        <>
          {model.meta.limitations.length > 0 ? (
            <p className="text-[12px] text-muted-foreground">
              {model.meta.limitations[0]} · completeness:{" "}
              {model.meta.completeness} · archive: {model.meta.archiveCount}
            </p>
          ) : null}

          <section className={`grid grid-cols-1 lg:grid-cols-2 ${dashboardGridGap}`}>
            <ProductivityTrendCard trend={model.engineeringScoreTrend} />
            <DeliveryTrendCard trend={model.engineeringValueDeliveredTrend} />
            <ProductivityTrendCard trend={model.recoveryHoursTrend} />
            <DeliveryTrendCard trend={model.capacityUtilizationTrend} />
            <ProductivityTrendCard trend={model.deliveryEfficiencyTrend} />
          </section>

          <section>
            <div className="mb-4">
              <h2 className={dashboardTypography.sectionTitle}>
                Technology Health Trends
              </h2>
              <p className={dashboardTypography.sectionDescription}>
                Engineering Health by technology from archived snapshots
              </p>
            </div>
            <div
              className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 ${dashboardGridGap}`}
            >
              {model.technologyHealthTrends.map((trend) => (
                <DeliveryTrendCard key={trend.title} trend={trend} />
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
