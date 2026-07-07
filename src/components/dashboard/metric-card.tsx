import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { SparklineChart } from "@/components/dashboard/sparkline-chart";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { TrendIndicator } from "@/components/dashboard/trend-indicator";
import {
  dashboardCard,
  dashboardCardContent,
  dashboardCardHeader,
  dashboardTypography,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";
import type { MetricCardProps } from "@/types/dashboard";

export function MetricCard({
  title,
  value,
  icon: Icon,
  status,
  statusLabel,
  trend = "neutral",
  trendLabel = "vs last month",
  chartColor = "var(--chart-2)",
  sparkline = [],
  valueClassName,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn(dashboardCard, className)}>
      <CardHeader
        className={cn(
          dashboardCardHeader,
          "flex flex-row items-start justify-between gap-3 pb-1"
        )}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/50">
            <Icon className="size-4 text-foreground/80" aria-hidden />
          </span>
          <span className={dashboardTypography.label}>{title}</span>
        </div>
        <StatusBadge status={status} label={statusLabel} />
      </CardHeader>

      <CardContent className={cn(dashboardCardContent, "space-y-3")}>
        <p
          className={cn(
            dashboardTypography.metricValue,
            valueClassName ?? "text-foreground"
          )}
        >
          {value}
        </p>

        <div className="flex items-end justify-between gap-3">
          <TrendIndicator direction={trend} label={trendLabel} />
          <div className="h-11 w-32 shrink-0">
            {sparkline.length > 1 && (
              <SparklineChart
                data={sparkline}
                color={chartColor}
                height={44}
                filled
                strokeWidth={2.75}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
