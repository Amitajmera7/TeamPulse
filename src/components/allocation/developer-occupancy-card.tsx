import { memo } from "react";
import { AlertTriangle, FolderKanban, ListChecks } from "lucide-react";

import { AllocationLoadChip } from "@/components/allocation/allocation-load-chip";
import { LOAD_STATUS_COLOR } from "@/components/allocation/allocation-palette";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { dashboardCard, dashboardCardContent, dashboardCardHeader } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";
import type { AllocationDeveloper } from "@/types/allocation";

interface DeveloperOccupancyCardProps {
  developer: AllocationDeveloper;
  onSelect: (id: string) => void;
}

function DeveloperAvatar({ developer }: { developer: AllocationDeveloper }) {
  if (developer.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Jira avatar URLs are arbitrary remote hosts
      <img
        src={developer.avatarUrl}
        alt=""
        className="size-10 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[13px] font-semibold text-primary">
      {developer.initials}
    </span>
  );
}

/**
 * Renders a single `AllocationDeveloper`. Memoized because a large instance
 * can render hundreds of these and only the selected card ever changes.
 */
export const DeveloperOccupancyCard = memo(function DeveloperOccupancyCard({
  developer,
  onSelect,
}: DeveloperOccupancyCardProps) {
  const workloadLabel =
    developer.remainingHours > 0
      ? `${developer.remainingHours}h remaining · ${developer.remainingDays}d`
      : "No remaining work";
  const projectLabel =
    developer.projects.length > 1
      ? `${developer.projects[0].key} +${developer.projects.length - 1}`
      : developer.projects[0]?.key ?? "—";

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onSelect(developer.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(developer.id);
        }
      }}
      className={cn(
        dashboardCard,
        "cursor-pointer",
        developer.status === "overloaded" && "border-l-2 border-l-destructive/60"
      )}
    >
      <CardHeader
        className={cn(dashboardCardHeader, "flex flex-row items-start justify-between gap-3")}
      >
        <div className="flex min-w-0 items-center gap-3">
          <DeveloperAvatar developer={developer} />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-foreground">
              {developer.displayName}
            </p>
            <p className="truncate text-[12px] text-muted-foreground">
              {developer.technology ?? developer.team ?? "—"}
            </p>
          </div>
        </div>
        <AllocationLoadChip status={developer.status} label={developer.statusLabel} />
      </CardHeader>

      <CardContent className={cn(dashboardCardContent, "space-y-3 pt-3")}>
        <div>
          <p className="text-[13px] font-medium text-foreground">{workloadLabel}</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Free by{" "}
            <span className="font-medium text-foreground">{developer.freeByLabel}</span>
          </p>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(developer.occupancyPercent, 100)}%`,
              backgroundColor: LOAD_STATUS_COLOR[developer.status],
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-2 text-[12px] text-muted-foreground">
          <span className="flex min-w-0 items-center gap-1.5">
            <FolderKanban className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{projectLabel}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <ListChecks className="size-3.5" aria-hidden />
            {developer.activeAssignments}
          </span>
          {developer.unestimatedAssignments > 0 && (
            <span
              className="flex shrink-0 items-center gap-1 text-amber-600 dark:text-amber-500"
              title={`${developer.unestimatedAssignments} unestimated`}
            >
              <AlertTriangle className="size-3.5" aria-hidden />
              {developer.unestimatedAssignments}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
