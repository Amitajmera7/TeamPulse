"use client";

import { useEffect, useState } from "react";

import { ExplorerBackLink } from "@/components/explorer/explorer-overview-cards";
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
import type { ExplorerProjectDetail } from "@/services/analytics-read/explorer";

function formatNum(value: number | null, suffix = ""): string {
  if (value === null) {
    return "—";
  }
  const text = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${text}${suffix}`;
}

interface ProjectDetailViewProps {
  id: string;
}

export function ProjectDetailView({ id }: ProjectDetailViewProps) {
  const [detail, setDetail] = useState<ExplorerProjectDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(
          `/api/explorer/projects/${encodeURIComponent(id)}`,
          { cache: "no-store" }
        );
        const payload = (await response.json()) as ExplorerProjectDetail & {
          success?: boolean;
          error?: string;
        };
        if (!response.ok || payload.success === false) {
          if (!cancelled) {
            setError(payload.error ?? "Project not found.");
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

  const project = detail?.project;

  return (
    <div className={dashboardSectionSpacing}>
      <ExplorerBackLink />
      <div>
        <h1 className={dashboardTypography.sectionTitle}>
          {project?.projectKey ?? "Project Detail"}
        </h1>
        <p className={dashboardTypography.sectionDescription}>
          Warehouse issue facts · Engineering Score not projected by project
        </p>
      </div>

      {error ? <p className="text-[13px] text-destructive">{error}</p> : null}

      {project ? (
        <>
          <Card className={dashboardCard}>
            <CardHeader className={dashboardCardHeader}>
              <CardTitle className={dashboardTypography.cardTitle}>
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent
              className={`${dashboardCardContent} grid grid-cols-2 gap-3 sm:grid-cols-4 text-[13px]`}
            >
              <div>
                <p className={dashboardTypography.label}>Issues</p>
                <p className="mt-1 font-semibold tabular-nums">
                  {project.issues}
                </p>
              </div>
              <div>
                <p className={dashboardTypography.label}>Stories</p>
                <p className="mt-1 font-medium tabular-nums">
                  {project.stories}
                </p>
              </div>
              <div>
                <p className={dashboardTypography.label}>Engineering Hours</p>
                <p className="mt-1 font-medium tabular-nums">
                  {formatNum(project.engineeringHours, "h")}
                </p>
              </div>
              <div>
                <p className={dashboardTypography.label}>Engineering Score</p>
                <p className="mt-1 font-medium tabular-nums">
                  {formatNum(project.engineeringScore)}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-4">
                <p className={dashboardTypography.label}>Technologies</p>
                <p className="mt-1 font-medium">
                  {detail?.technologies.length
                    ? detail.technologies.join(", ")
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className={dashboardCard}>
            <CardHeader className={dashboardCardHeader}>
              <CardTitle className={dashboardTypography.cardTitle}>
                Issues
              </CardTitle>
            </CardHeader>
            <CardContent className={dashboardCardContent}>
              {(detail?.issues.length ?? 0) === 0 ? (
                <p className="text-[13px] text-muted-foreground">
                  No issues for this project in the latest warehouse batch.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/60 hover:bg-transparent">
                        <TableHead>Issue Key</TableHead>
                        <TableHead>Summary</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Technology</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail?.issues.map((issue) => (
                        <TableRow
                          key={issue.issueKey}
                          className="border-border/60"
                        >
                          <TableCell className="font-mono text-[12px]">
                            {issue.issueKey}
                          </TableCell>
                          <TableCell className="max-w-[280px] truncate text-[13px]">
                            {issue.summary}
                          </TableCell>
                          <TableCell className="text-[13px]">
                            {issue.issueType}
                          </TableCell>
                          <TableCell className="text-[13px]">
                            {issue.technology || "—"}
                          </TableCell>
                          <TableCell className="text-[13px]">
                            {issue.status}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {detail?.meta.limitations[0] ? (
            <p className="text-[12px] text-muted-foreground">
              {detail.meta.limitations[0]}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
