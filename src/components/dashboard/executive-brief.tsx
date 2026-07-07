import { ChevronRight, Lightbulb } from "lucide-react";

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
import type { EngineeringInsight } from "@/services/dashboard/types";
import { cn } from "@/lib/utils";

const DOT_TONE: Record<string, string> = {
  success: "bg-primary",
  warning: "bg-chart-4",
  info: "bg-chart-3",
};

interface ExecutiveBriefProps {
  insights: EngineeringInsight[];
  className?: string;
}

export function ExecutiveBrief({ insights, className }: ExecutiveBriefProps) {
  return (
    <Card className={cn(dashboardCard, className)}>
      <CardHeader
        className={cn(dashboardCardHeader, "flex flex-row items-center gap-3 pb-3")}
      >
        <span className="flex size-9 items-center justify-center rounded-lg border border-chart-4/20 bg-chart-4/10">
          <Lightbulb className="size-4 text-chart-4" aria-hidden />
        </span>
        <CardTitle className={dashboardTypography.cardTitle}>
          Executive Brief
        </CardTitle>
      </CardHeader>

      <CardContent className={cn(dashboardCardContent, "divide-y divide-border/60 p-0 pt-0")}>
        {insights.map((item) => (
          <div
            key={item.id}
            className="group flex items-start gap-3 px-5 py-4 transition-colors duration-200 hover:bg-muted/35"
          >
            <span
              className={cn(
                "mt-2 size-2 shrink-0 rounded-full",
                DOT_TONE[item.tone]
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[15px] font-semibold text-foreground">
                {item.title}
              </p>
              <p className={dashboardTypography.description}>{item.description}</p>
            </div>
            <ChevronRight
              className="mt-1.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
              aria-hidden
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
