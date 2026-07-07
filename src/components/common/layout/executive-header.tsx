import { format } from "date-fns";

import { EngineeringScoreCard } from "@/components/common/layout/engineering-score-card";
import { MetadataChip } from "@/components/common/layout/metadata-chip";
import { getGreeting } from "@/lib/greeting";
import { cn } from "@/lib/utils";

interface ExecutiveHeaderProps {
  description?: string;
  className?: string;
}

export function ExecutiveHeader({
  description = "Monitor delivery health, productivity, and team performance",
  className,
}: ExecutiveHeaderProps) {
  const reportingMonth = format(new Date(), "MMMM yyyy");

  return (
    <div
      className={cn(
        "border-b border-border bg-background px-4 py-3 lg:px-6",
        className
      )}
    >
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px] sm:leading-tight">
            Engineering Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">
            Engineering Performance Platform
          </p>
          <p className="text-xs text-muted-foreground/80">{getGreeting()}</p>
          {description && (
            <p className="pt-0.5 text-xs text-muted-foreground">{description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <MetadataChip value={reportingMonth} />
            <MetadataChip value="All Teams" />
            <MetadataChip value="Updated 2 min ago" />
          </div>
        </div>

        <EngineeringScoreCard className="shrink-0" />
      </div>
    </div>
  );
}
