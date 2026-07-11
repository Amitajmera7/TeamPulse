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
import { cn } from "@/lib/utils";

interface OperationsRuntimeLogsProps {
  lines: readonly string[];
}

export function OperationsRuntimeLogs({ lines }: OperationsRuntimeLogsProps) {
  return (
    <Card className={dashboardCard}>
      <CardHeader className={dashboardCardHeader}>
        <CardTitle className={dashboardTypography.cardTitle}>
          Latest Runtime Logs
        </CardTitle>
        <p className={dashboardTypography.description}>
          Recent operations events from the sync orchestrator
        </p>
      </CardHeader>
      <CardContent className={cn(dashboardCardContent)}>
        <div className="max-h-72 overflow-y-auto rounded-lg border border-border/60 bg-muted/30 p-4 font-mono text-[12px] leading-relaxed text-foreground">
          {lines.length === 0 ? (
            <p className="text-muted-foreground">No log lines yet.</p>
          ) : (
            <ul className="space-y-1">
              {[...lines].reverse().map((line, index) => (
                <li key={`${index}-${line.slice(0, 24)}`}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
