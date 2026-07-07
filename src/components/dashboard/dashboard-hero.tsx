import { format, formatDistanceToNow } from "date-fns";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, Star, Users } from "lucide-react";

import { SparklineChart } from "@/components/dashboard/sparkline-chart";
import { getGreeting } from "@/lib/greeting";
import {
  dashboardCard,
  dashboardTypography,
} from "@/lib/dashboard-ui";
import type { EngineeringScoreData } from "@/services/dashboard/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DashboardHeroProps {
  engineeringScore: EngineeringScoreData;
  className?: string;
}

function MetaChip({
  icon: Icon,
  value,
  live,
}: {
  icon: LucideIcon;
  value: string;
  live?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-[13px] font-medium text-foreground shadow-sm transition-all duration-200 hover:border-primary/20">
      {live ? (
        <span className="size-1.5 rounded-full bg-primary" aria-hidden />
      ) : (
        <Icon className="size-3.5 text-muted-foreground" aria-hidden />
      )}
      <span>{value}</span>
    </div>
  );
}

function scoreSubtitle(score: EngineeringScoreData): string {
  if (score.value >= 85) {
    return "Your engineering organization is performing well.";
  }
  if (score.value >= 70) {
    return "Engineering performance is on track with room to optimize.";
  }
  return "Several metrics need attention this period.";
}

export function DashboardHero({
  engineeringScore,
  className,
}: DashboardHeroProps) {
  const reportingMonth = format(new Date(), "MMMM yyyy");

  return (
    <div
      className={cn(
        "border-b border-border/70 bg-background px-4 py-8 lg:px-8",
        className
      )}
    >
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 space-y-3">
          <h1 className={dashboardTypography.title}>Engineering Intelligence</h1>
          <p className={dashboardTypography.description}>
            {scoreSubtitle(engineeringScore)}
          </p>
          <p className="text-[13px] text-muted-foreground/80 md:hidden">
            {getGreeting()}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <MetaChip icon={CalendarDays} value={reportingMonth} />
            <MetaChip icon={Users} value="All Teams" />
            <MetaChip
              icon={CalendarDays}
              value={`Live · Updated ${formatDistanceToNow(new Date(), { addSuffix: true })}`}
              live
            />
          </div>
        </div>

        <div
          className={cn(
            dashboardCard,
            "relative w-full overflow-hidden p-5 xl:w-[300px] xl:shrink-0"
          )}
        >
          <Star
            className="absolute top-4 right-4 size-4 text-primary"
            aria-hidden
          />
          <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            Engineering Score
          </p>
          <div className="mt-2 flex items-end gap-2">
            <span className={dashboardTypography.metricValue}>
              {engineeringScore.value}
            </span>
            <span className="mb-1 text-[13px] font-semibold text-primary">
              {engineeringScore.trend}
            </span>
          </div>
          <Badge
            variant="secondary"
            className="mt-2 border-primary/15 bg-primary/10 text-primary"
          >
            {engineeringScore.status}
          </Badge>
          <div className="mt-4 h-12">
            <SparklineChart
              data={engineeringScore.sparkline}
              color="var(--chart-2)"
              filled
              height={48}
              strokeWidth={2.75}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
