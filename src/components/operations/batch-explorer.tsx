"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OperationsRuntimeLogs } from "@/components/operations/operations-runtime-logs";
import { OperationsSyncTimeline } from "@/components/operations/operations-sync-timeline";
import {
  dashboardCard,
  dashboardCardContent,
  dashboardCardHeader,
  dashboardSectionSpacing,
  dashboardTypography,
} from "@/lib/dashboard-ui";
import type { AnalyticsSyncStep } from "@/services/orchestrator";
import type {
  SyncHistoryDetailResult,
  SyncHistoryEntry,
} from "@/services/operations-history";

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "—";
  }
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatDuration(ms: number | null): string {
  if (ms == null) {
    return "—";
  }
  if (ms < 1000) {
    return `${ms} ms`;
  }
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return `${minutes}m ${rem}s`;
}

interface BatchExplorerProps {
  batchId: string;
}

export function BatchExplorer({ batchId }: BatchExplorerProps) {
  const [detail, setDetail] = useState<SyncHistoryDetailResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/operations/history/${encodeURIComponent(batchId)}`,
          { cache: "no-store" }
        );
        const payload = (await response.json()) as SyncHistoryDetailResult & {
          success?: boolean;
          error?: string;
        };
        if (!response.ok || payload.success === false) {
          if (!cancelled) {
            setError(payload.error ?? `Not found (${response.status})`);
            setDetail(null);
          }
          return;
        }
        if (!cancelled) {
          setDetail(payload);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load batch detail."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [batchId]);

  const entry = detail?.entry;

  return (
    <div className={dashboardSectionSpacing}>
      <div>
        <div className="mb-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/operations/history">
              <ArrowLeft data-icon="inline-start" />
              Back to Sync History
            </Link>
          </Button>
        </div>
        <h1 className={dashboardTypography.sectionTitle}>Batch Explorer</h1>
        <p className={dashboardTypography.sectionDescription}>
          Detail for sync run{" "}
          <span className="font-mono text-foreground">{batchId}</span>
          {detail
            ? ` · source: ${detail.source}${
                detail.warehouseAvailable ? "" : " (warehouse unavailable)"
              }`
            : ""}
        </p>
      </div>

      {loading ? (
        <p className="text-[13px] text-muted-foreground">Loading batch…</p>
      ) : null}
      {error ? (
        <p className="text-[13px] text-destructive">{error}</p>
      ) : null}

      {entry ? (
        <>
          <BatchSummaryCard entry={entry} />
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ProcessingCountsCard entry={entry} />
            <ValidationSummaryCard entry={entry} />
          </section>
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <OperationsSyncTimeline
                steps={(detail?.pipelineSteps ?? []) as AnalyticsSyncStep[]}
                currentStep={entry.currentStep}
                syncStatus={entry.syncStatus}
                progressPercent={entry.progressPercent}
              />
            </div>
            <div className="xl:col-span-5 space-y-4">
              <Card className={dashboardCard}>
                <CardHeader className={dashboardCardHeader}>
                  <CardTitle className={dashboardTypography.cardTitle}>
                    Verification Report
                  </CardTitle>
                  <p className={dashboardTypography.description}>
                    Derived from this sync run&apos;s operational outcome
                  </p>
                </CardHeader>
                <CardContent className={dashboardCardContent}>
                  <pre className="overflow-x-auto rounded-lg border border-border/60 bg-muted/30 p-4 font-mono text-[12px] leading-relaxed whitespace-pre-wrap">
                    {detail?.verificationReport}
                  </pre>
                </CardContent>
              </Card>
              <OperationsRuntimeLogs lines={entry.logLines} />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function BatchSummaryCard({ entry }: { entry: SyncHistoryEntry }) {
  return (
    <Card className={dashboardCard}>
      <CardHeader className={dashboardCardHeader}>
        <CardTitle className={dashboardTypography.cardTitle}>Summary</CardTitle>
        <p className={dashboardTypography.description}>
          High-level outcome for this sync batch
        </p>
      </CardHeader>
      <CardContent
        className={`${dashboardCardContent} grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 text-[13px]`}
      >
        <div>
          <p className={dashboardTypography.label}>Status</p>
          <p className="mt-1 font-medium">{entry.syncStatus}</p>
        </div>
        <div>
          <p className={dashboardTypography.label}>Started</p>
          <p className="mt-1 font-medium tabular-nums">
            {formatTimestamp(entry.startedAt)}
          </p>
        </div>
        <div>
          <p className={dashboardTypography.label}>Completed</p>
          <p className="mt-1 font-medium tabular-nums">
            {formatTimestamp(entry.completedAt)}
          </p>
        </div>
        <div>
          <p className={dashboardTypography.label}>Duration</p>
          <p className="mt-1 font-medium tabular-nums">
            {formatDuration(entry.durationMs)}
          </p>
        </div>
        <div>
          <p className={dashboardTypography.label}>EAW Batch ID</p>
          <p className="mt-1 break-all font-medium">
            {entry.eawBatchId ?? "—"}
          </p>
        </div>
        <div>
          <p className={dashboardTypography.label}>Entry Source</p>
          <p className="mt-1 font-medium">{entry.entrySource}</p>
        </div>
        <div>
          <p className={dashboardTypography.label}>Error</p>
          <p className="mt-1 font-medium">{entry.errorMessage ?? "—"}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProcessingCountsCard({ entry }: { entry: SyncHistoryEntry }) {
  return (
    <Card className={dashboardCard}>
      <CardHeader className={dashboardCardHeader}>
        <CardTitle className={dashboardTypography.cardTitle}>
          Processing Counts
        </CardTitle>
      </CardHeader>
      <CardContent
        className={`${dashboardCardContent} grid grid-cols-2 gap-4 text-[13px]`}
      >
        <div>
          <p className={dashboardTypography.label}>Issues Processed</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {entry.issuesProcessed}
          </p>
        </div>
        <div>
          <p className={dashboardTypography.label}>Worklogs Processed</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {entry.worklogsProcessed}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ValidationSummaryCard({ entry }: { entry: SyncHistoryEntry }) {
  return (
    <Card className={dashboardCard}>
      <CardHeader className={dashboardCardHeader}>
        <CardTitle className={dashboardTypography.cardTitle}>
          Validation Summary
        </CardTitle>
      </CardHeader>
      <CardContent
        className={`${dashboardCardContent} grid grid-cols-1 gap-3 sm:grid-cols-3 text-[13px]`}
      >
        <div>
          <p className={dashboardTypography.label}>Validation</p>
          <p className="mt-1 font-medium">{entry.validationStatus}</p>
        </div>
        <div>
          <p className={dashboardTypography.label}>Warehouse</p>
          <p className="mt-1 font-medium">{entry.warehouseStatus}</p>
        </div>
        <div>
          <p className={dashboardTypography.label}>Analytics</p>
          <p className="mt-1 font-medium">{entry.analyticsStatus}</p>
        </div>
      </CardContent>
    </Card>
  );
}
