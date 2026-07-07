import { Bot } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

interface AiInsightsCardProps {
  className?: string;
}

export function AiInsightsCard({ className }: AiInsightsCardProps) {
  return (
    <Card className={cn(dashboardCard, "flex flex-col", className)}>
      <CardHeader
        className={cn(
          dashboardCardHeader,
          "flex flex-row items-center justify-between pb-3"
        )}
      >
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg border border-primary/15 bg-primary/10">
            <Bot className="size-4 text-primary" aria-hidden />
          </span>
          <CardTitle className={dashboardTypography.cardTitle}>
            AI Insights
          </CardTitle>
        </div>
        <Badge
          variant="outline"
          className="h-6 rounded-md border-primary/20 px-2 text-[11px] font-medium"
        >
          Beta
        </Badge>
      </CardHeader>

      <CardContent
        className={cn(
          dashboardCardContent,
          "flex flex-1 flex-col items-center justify-center px-6 py-10 text-center"
        )}
      >
        <span className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-border/70 bg-muted/30 shadow-sm">
          <Bot className="size-7 text-muted-foreground/80" aria-hidden />
        </span>
        <p className="text-[15px] font-semibold text-foreground">
          AI insights will be available soon
        </p>
        <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
          Connect more data to unlock AI-powered recommendations, risk detection
          and predictive insights.
        </p>
      </CardContent>
    </Card>
  );
}
