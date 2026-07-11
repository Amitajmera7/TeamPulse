"use client";

import Link from "next/link";
import { Download, History, Play, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
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

interface OperationsActionsProps {
  isRunning: boolean;
  onRunSync: () => void;
  onRefresh: () => void;
}

export function OperationsActions({
  isRunning,
  onRunSync,
  onRefresh,
}: OperationsActionsProps) {
  return (
    <Card className={dashboardCard}>
      <CardHeader className={dashboardCardHeader}>
        <CardTitle className={dashboardTypography.cardTitle}>Actions</CardTitle>
        <p className={dashboardTypography.description}>
          Operational controls for TeamPulse sync
        </p>
      </CardHeader>
      <CardContent
        className={`${dashboardCardContent} flex flex-wrap gap-2`}
      >
        <Button
          size="lg"
          onClick={onRunSync}
          disabled={isRunning}
          aria-label="Run Sync"
        >
          <Play data-icon="inline-start" />
          {isRunning ? "Sync Running…" : "Run Sync"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={onRefresh}
          disabled={isRunning}
          aria-label="Refresh operations status"
        >
          <RefreshCw data-icon="inline-start" />
          Refresh
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/operations/history" aria-label="View Sync History">
            <History data-icon="inline-start" />
            View Sync History
          </Link>
        </Button>
        <Button
          size="lg"
          variant="outline"
          disabled
          title="Coming soon"
          aria-label="Download Verification Report (placeholder)"
        >
          <Download data-icon="inline-start" />
          Download Verification Report
        </Button>
      </CardContent>
    </Card>
  );
}
