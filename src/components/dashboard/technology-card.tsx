import type { LucideIcon } from "lucide-react";
import {
  Code2,
  Layers,
  Monitor,
  ShoppingBag,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SparklineChart } from "@/components/dashboard/sparkline-chart";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  dashboardCard,
  dashboardCardContent,
  dashboardCardHeader,
  dashboardTypography,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";
import type { TechnologyCardProps } from "@/types/dashboard";

const TECH_ICONS: Record<string, LucideIcon> = {
  magento: ShoppingBag,
  react: Code2,
  html: Layers,
  dt: Monitor,
};

export function TechnologyCard({
  id,
  name,
  status,
  statusLabel,
  developers,
  hours,
  stories,
  sparkline,
  chartColor = "var(--chart-2)",
  className,
}: TechnologyCardProps) {
  const Icon = TECH_ICONS[id] ?? Code2;

  return (
    <Card className={cn(dashboardCard, className)}>
      <CardHeader
        className={cn(
          dashboardCardHeader,
          "flex flex-row items-center justify-between gap-3 pb-3"
        )}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg border border-border/70 bg-primary/8">
            <Icon className="size-4 text-primary" aria-hidden />
          </span>
          <CardTitle className={dashboardTypography.cardTitle}>{name}</CardTitle>
        </div>
        <StatusBadge status={status} label={statusLabel} />
      </CardHeader>

      <CardContent className={cn(dashboardCardContent, "pt-0")}>
        <div className="grid grid-cols-3 gap-3 border-t border-border/60 pt-4">
          <div className="text-center">
            <p className={dashboardTypography.label}>Developers</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
              {developers}
            </p>
          </div>
          <div className="text-center">
            <p className={dashboardTypography.label}>Hours</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
              {hours}
            </p>
          </div>
          <div className="text-center">
            <p className={dashboardTypography.label}>Stories</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
              {stories}
            </p>
          </div>
        </div>
        <div className="mt-4 h-9">
          <SparklineChart
            data={sparkline}
            color={chartColor}
            height={36}
            filled
            strokeWidth={2.5}
          />
        </div>
      </CardContent>
    </Card>
  );
}
