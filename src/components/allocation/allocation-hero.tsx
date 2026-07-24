import { CalendarClock, Database, Sparkles, Timer } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { dashboardCard, dashboardTypography } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";
import type { AllocationSummary } from "@/types/allocation";

interface AllocationHeroProps {
  summary: AllocationSummary;
  className?: string;
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        <span className="text-[12px] font-medium tracking-wide uppercase">
          {label}
        </span>
      </div>
      <span className="text-[13px] font-semibold text-foreground">{value}</span>
    </div>
  );
}

export function AllocationHero({ summary, className }: AllocationHeroProps) {
  return (
    <div
      className={cn(
        "border-b border-border/70 bg-background px-4 py-8 lg:px-8",
        className
      )}
    >
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 space-y-4">
          <div>
            <h1 className={dashboardTypography.title}>Team Allocation</h1>
            <p className={dashboardTypography.description}>
              Who&apos;s available, who&apos;s overloaded, and when capacity
              opens up.
            </p>
          </div>

          <div
            className={cn(
              "flex max-w-2xl items-start gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4"
            )}
          >
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="size-3.5 text-primary" aria-hidden />
            </span>
            <p className="text-[15px] font-medium leading-relaxed text-foreground">
              {summary.headline}
            </p>
          </div>
        </div>

        <div
          className={cn(
            dashboardCard,
            "w-full divide-y divide-border/60 p-5 xl:w-[300px] xl:shrink-0"
          )}
        >
          <p className="pb-2 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            Snapshot
          </p>
          <MetaRow
            icon={CalendarClock}
            label="Last Updated"
            value={summary.lastUpdatedLabel}
          />
          <MetaRow
            icon={Timer}
            label="Working Day"
            value={summary.workingDayLabel}
          />
          <MetaRow
            icon={Database}
            label="Data Source"
            value={summary.dataSourceLabel}
          />
        </div>
      </div>
    </div>
  );
}
