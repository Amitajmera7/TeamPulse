"use client";

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
  dashboardTypography,
} from "@/lib/dashboard-ui";
import type { LastSyncSummary } from "@/services/orchestrator";
import { cn } from "@/lib/utils";

interface OperationsVerificationSummaryProps {
  lastSync: LastSyncSummary;
}

export function OperationsVerificationSummary({
  lastSync,
}: OperationsVerificationSummaryProps) {
  const lines = [
    `Validation Status: ${lastSync.validationStatus}`,
    `Warehouse Status: ${lastSync.warehouseStatus}`,
    `Analytics Status: ${lastSync.analyticsStatus}`,
    `Issues: ${lastSync.issuesProcessed}`,
    `Worklogs: ${lastSync.worklogsProcessed}`,
    `EAW Batch: ${lastSync.eawBatchId ?? "—"}`,
    `Overall: ${lastSync.success ? "PASS" : lastSync.errorMessage ? "FAIL" : "IDLE"}`,
  ];

  return (
    <Card className={dashboardCard}>
      <CardHeader className={dashboardCardHeader}>
        <CardTitle className={dashboardTypography.cardTitle}>
          Latest Verification Summary
        </CardTitle>
        <p className={dashboardTypography.description}>
          Derived from the last sync outcome (full Runtime Verification download
          is a placeholder)
        </p>
      </CardHeader>
      <CardContent className={cn(dashboardCardContent)}>
        <pre className="overflow-x-auto rounded-lg border border-border/60 bg-muted/30 p-4 font-mono text-[12px] leading-relaxed text-foreground whitespace-pre-wrap">
          {["Verification Report", "", ...lines].join("\n")}
        </pre>
      </CardContent>
    </Card>
  );
}
