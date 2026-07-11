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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  dashboardCard,
  dashboardCardContent,
  dashboardCardHeader,
  dashboardSectionSpacing,
  dashboardTypography,
} from "@/lib/dashboard-ui";
import type { ExplorerTechnologyDetail } from "@/services/analytics-read/explorer";

function formatNum(value: number | null, suffix = ""): string {
  if (value === null) {
    return "—";
  }
  const text = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${text}${suffix}`;
}

interface TechnologyDetailViewProps {
  id: string;
}

export function TechnologyDetailView({ id }: TechnologyDetailViewProps) {
  const [detail, setDetail] = useState<ExplorerTechnologyDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(
          `/api/explorer/technologies/${encodeURIComponent(id)}`,
          { cache: "no-store" }
        );
        const payload = (await response.json()) as ExplorerTechnologyDetail & {
          success?: boolean;
          error?: string;
        };
        if (!response.ok || payload.success === false) {
          if (!cancelled) {
            setError(payload.error ?? "Technology not found.");
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

  const technology = detail?.technology;

  return (
    <div className={dashboardSectionSpacing}>
      <ExplorerBackLink />
      <div>
        <h1 className={dashboardTypography.sectionTitle}>
          {technology?.name ?? "Technology Detail"}
        </h1>
        <p className={dashboardTypography.sectionDescription}>
          {technology?.statusLabel ?? "—"}
          {detail?.reportingPeriod.month
            ? ` · ${detail.reportingPeriod.month}`
            : ""}
        </p>
      </div>

      {error ? <p className="text-[13px] text-destructive">{error}</p> : null}

      {technology ? (
        <>
          <Card className={dashboardCard}>
            <CardHeader className={dashboardCardHeader}>
              <CardTitle className={dashboardTypography.cardTitle}>
                Technology Health
              </CardTitle>
            </CardHeader>
            <CardContent
              className={`${dashboardCardContent} grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6 text-[13px]`}
            >
              <div>
                <p className={dashboardTypography.label}>Engineering Health</p>
                <p className="mt-1 font-semibold tabular-nums">
                  {formatNum(technology.engineeringHealth)}
                </p>
              </div>
              <div>
                <p className={dashboardTypography.label}>Value Delivered</p>
                <p className="mt-1 font-medium tabular-nums">
                  {formatNum(technology.engineeringValueDeliveredHours, "h")}
                </p>
              </div>
              <div>
                <p className={dashboardTypography.label}>Recovery</p>
                <p className="mt-1 font-medium tabular-nums">
                  {formatNum(technology.recoveryHours, "h")}
                </p>
              </div>
              <div>
                <p className={dashboardTypography.label}>Capacity</p>
                <p className="mt-1 font-medium tabular-nums">
                  {formatNum(technology.capacity)}
                </p>
              </div>
              <div>
                <p className={dashboardTypography.label}>Efficiency</p>
                <p className="mt-1 font-medium tabular-nums">
                  {formatNum(technology.deliveryEfficiency)}
                </p>
              </div>
              <div>
                <p className={dashboardTypography.label}>Developers</p>
                <p className="mt-1 font-medium tabular-nums">
                  {technology.developers}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-3 xl:col-span-6">
                <p className={dashboardTypography.label}>Trend</p>
                <div className="mt-2">
                  <SparklineChart
                    data={
                      technology.trend.length > 0
                        ? technology.trend
                        : technology.engineeringHealth != null
                          ? [technology.engineeringHealth]
                          : []
                    }
                    color="var(--chart-1)"
                    height={40}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={dashboardCard}>
            <CardHeader className={dashboardCardHeader}>
              <CardTitle className={dashboardTypography.cardTitle}>
                Developers
              </CardTitle>
            </CardHeader>
            <CardContent className={dashboardCardContent}>
              {(detail?.developers.length ?? 0) === 0 ? (
                <p className="text-[13px] text-muted-foreground">
                  No developers mapped to this technology in the snapshot.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableHead>Developer</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail?.developers.map((row) => (
                      <TableRow key={row.id} className="border-border/60">
                        <TableCell>
                          <Link
                            href={`/explorer/developers/${encodeURIComponent(row.id)}`}
                            className="text-[13px] font-medium text-primary hover:underline"
                          >
                            {row.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-[13px]">
                          {formatNum(row.engineeringScore)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-[13px]">
                          {formatNum(row.deliveredHours, "h")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
