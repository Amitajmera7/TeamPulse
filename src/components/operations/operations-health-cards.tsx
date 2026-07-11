"use client";

import {
  Activity,
  CheckCircle2,
  Clock3,
  Database,
  Loader2,
  Server,
  ShieldCheck,
} from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import {
  dashboardGridGap,
  dashboardTypography,
} from "@/lib/dashboard-ui";
import type { LastSyncSummary } from "@/services/orchestrator";
import type { SyncState } from "@/services/orchestrator";
import type { MetricStatus } from "@/types/dashboard";

function statusToMetric(
  status: string
): { status: MetricStatus; label: string } {
  const normalized = status.toLowerCase();
  if (
    normalized === "completed" ||
    normalized === "pass" ||
    normalized === "persisted" ||
    normalized === "published" ||
    normalized === "healthy"
  ) {
    return { status: "healthy", label: status };
  }
  if (
    normalized === "running" ||
    normalized === "unknown" ||
    normalized === "not run"
  ) {
    return { status: "neutral", label: status };
  }
  if (normalized === "failed" || normalized === "fail" || normalized === "not persisted" || normalized === "not published") {
    return { status: "attention", label: status };
  }
  return { status: "on-track", label: status };
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

interface OperationsHealthCardsProps {
  syncState: SyncState;
  lastSync: LastSyncSummary;
}

export function OperationsHealthCards({
  syncState,
  lastSync,
}: OperationsHealthCardsProps) {
  const sync = statusToMetric(syncState.status);
  const validation = statusToMetric(lastSync.validationStatus);
  const warehouse = statusToMetric(lastSync.warehouseStatus);
  const analytics = statusToMetric(lastSync.analyticsStatus);

  const isRunning = syncState.status === "Running";

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 ${dashboardGridGap}`}>
      <MetricCard
        title="Sync Status"
        value={syncState.status}
        icon={isRunning ? Loader2 : Activity}
        status={sync.status}
        statusLabel={sync.label}
        trend="neutral"
        trendLabel={
          isRunning
            ? `${syncState.progressPercent}% · ${syncState.currentStep}`
            : "Live orchestrator state"
        }
        sparkline={[]}
      />
      <MetricCard
        title="Validation"
        value={lastSync.validationStatus}
        icon={ShieldCheck}
        status={validation.status}
        statusLabel={validation.label}
        trend="neutral"
        trendLabel="EAW validation gate"
        sparkline={[]}
      />
      <MetricCard
        title="Warehouse"
        value={lastSync.warehouseStatus}
        icon={Database}
        status={warehouse.status}
        statusLabel={warehouse.label}
        trend="neutral"
        trendLabel={
          lastSync.eawBatchId
            ? `Batch ${lastSync.eawBatchId.slice(0, 8)}…`
            : "No batch id"
        }
        sparkline={[]}
      />
      <MetricCard
        title="Analytics"
        value={lastSync.analyticsStatus}
        icon={Server}
        status={analytics.status}
        statusLabel={analytics.label}
        trend="neutral"
        trendLabel={
          lastSync.snapshotPublished
            ? "Snapshot published"
            : "Snapshot not published"
        }
        sparkline={[]}
      />

      <MetricCard
        title="Last Successful Sync"
        value={
          lastSync.success && lastSync.completedAt
            ? formatTimestamp(lastSync.completedAt)
            : "—"
        }
        icon={CheckCircle2}
        status={lastSync.success ? "healthy" : "neutral"}
        statusLabel={lastSync.success ? "Completed" : "None yet"}
        trend="neutral"
        trendLabel="Most recent PASS run"
        sparkline={[]}
        valueClassName="text-[1.35rem] font-bold leading-snug tracking-tight"
      />
      <MetricCard
        title="Duration"
        value={formatDuration(lastSync.durationMs)}
        icon={Clock3}
        status="neutral"
        statusLabel="Elapsed"
        trend="neutral"
        trendLabel={`Started ${formatTimestamp(lastSync.startedAt)}`}
        sparkline={[]}
      />
      <MetricCard
        title="Issues Processed"
        value={String(lastSync.issuesProcessed)}
        icon={Activity}
        status="on-track"
        statusLabel="Jira issues"
        trend="neutral"
        trendLabel={`Completed ${formatTimestamp(lastSync.completedAt)}`}
        sparkline={[]}
      />
      <MetricCard
        title="Worklogs Processed"
        value={String(lastSync.worklogsProcessed)}
        icon={Activity}
        status="on-track"
        statusLabel="Worklog entries"
        trend="neutral"
        trendLabel={
          lastSync.eawBatchId
            ? `EAW ${lastSync.eawBatchId}`
            : "EAW batch pending"
        }
        sparkline={[]}
        valueClassName={
          lastSync.eawBatchId
            ? undefined
            : undefined
        }
      />
    </div>
  );
}

export function OperationsDetailStrip({ lastSync }: { lastSync: LastSyncSummary }) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-border/70 bg-card p-4 text-[13px] md:grid-cols-2 xl:grid-cols-4">
      <div>
        <p className={dashboardTypography.label}>Started Time</p>
        <p className="mt-1 font-medium tabular-nums text-foreground">
          {formatTimestamp(lastSync.startedAt)}
        </p>
      </div>
      <div>
        <p className={dashboardTypography.label}>Completed Time</p>
        <p className="mt-1 font-medium tabular-nums text-foreground">
          {formatTimestamp(lastSync.completedAt)}
        </p>
      </div>
      <div>
        <p className={dashboardTypography.label}>EAW Batch ID</p>
        <p className="mt-1 break-all font-medium text-foreground">
          {lastSync.eawBatchId ?? "—"}
        </p>
      </div>
      <div>
        <p className={dashboardTypography.label}>Error</p>
        <p className="mt-1 font-medium text-foreground">
          {lastSync.errorMessage ?? "—"}
        </p>
      </div>
    </div>
  );
}
