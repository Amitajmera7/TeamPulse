"use client";

import Link from "next/link";

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
  dashboardTypography,
} from "@/lib/dashboard-ui";
import type { SyncHistoryEntry } from "@/services/operations-history";
import { cn } from "@/lib/utils";

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

interface SyncHistoryTableProps {
  entries: readonly SyncHistoryEntry[];
  className?: string;
}

export function SyncHistoryTable({ entries, className }: SyncHistoryTableProps) {
  return (
    <Card className={cn(dashboardCard, className)}>
      <CardHeader className={dashboardCardHeader}>
        <CardTitle className={dashboardTypography.cardTitle}>
          Sync History
        </CardTitle>
        <p className={dashboardTypography.description}>
          Previous TeamPulse sync runs · newest first
        </p>
      </CardHeader>
      <CardContent className={cn(dashboardCardContent, "pt-0")}>
        {entries.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-muted-foreground">
            No sync history yet. Run a sync from Operations to populate this
            list.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Issues</TableHead>
                  <TableHead className="text-right">Worklogs</TableHead>
                  <TableHead>Validation</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Analytics</TableHead>
                  <TableHead>Batch ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow
                    key={entry.historyId}
                    className="border-border/60"
                  >
                    <TableCell className="whitespace-nowrap tabular-nums text-[13px]">
                      {formatTimestamp(entry.startedAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums text-[13px]">
                      {formatTimestamp(entry.completedAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums text-[13px]">
                      {formatDuration(entry.durationMs)}
                    </TableCell>
                    <TableCell className="text-[13px] font-medium">
                      {entry.syncStatus}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[13px]">
                      {entry.issuesProcessed}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[13px]">
                      {entry.worklogsProcessed}
                    </TableCell>
                    <TableCell className="text-[13px]">
                      {entry.validationStatus}
                    </TableCell>
                    <TableCell className="text-[13px]">
                      {entry.warehouseStatus}
                    </TableCell>
                    <TableCell className="text-[13px]">
                      {entry.analyticsStatus}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-[13px]">
                      <Link
                        href={`/operations/history/${encodeURIComponent(entry.historyId)}`}
                        className="font-medium text-primary hover:underline"
                        title={entry.eawBatchId ?? entry.historyId}
                      >
                        {entry.eawBatchId
                          ? `${entry.eawBatchId.slice(0, 12)}…`
                          : entry.historyId.slice(0, 16)}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
