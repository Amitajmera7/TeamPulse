import { CalendarClock, Clock3, FolderKanban } from "lucide-react";

import { AssignmentStatusPill } from "@/components/allocation/allocation-badges";
import { AllocationLoadChip } from "@/components/allocation/allocation-load-chip";
import { projectColor } from "@/components/allocation/allocation-palette";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { dashboardTypography } from "@/lib/dashboard-ui";
import type { AllocationAssignment, AllocationDeveloper } from "@/types/allocation";

interface WorkloadDetailDrawerProps {
  developer: AllocationDeveloper | null;
  /** The developer's slice of the flat assignments collection. */
  assignments: readonly AllocationAssignment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkloadDetailDrawer({
  developer,
  assignments,
  open,
  onOpenChange,
}: WorkloadDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        {developer && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[13px] font-semibold text-primary">
                  {developer.initials}
                </span>
                <div className="min-w-0">
                  <SheetTitle>{developer.displayName}</SheetTitle>
                  <SheetDescription>
                    {[developer.technology, developer.team].filter(Boolean).join(" · ") ||
                      "No technology or team set"}
                  </SheetDescription>
                </div>
                <AllocationLoadChip
                  status={developer.status}
                  label={developer.statusLabel}
                  className="ml-auto"
                />
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-3 gap-3 rounded-xl border border-border/70 bg-muted/30 p-4">
                <div>
                  <p className={dashboardTypography.label}>Remaining</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                    {developer.remainingHours}h
                  </p>
                </div>
                <div>
                  <p className={dashboardTypography.label}>Working Days</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                    {developer.remainingDays}
                  </p>
                </div>
                <div>
                  <p className={dashboardTypography.label}>Free By</p>
                  <p className="mt-1 text-[13px] font-semibold text-foreground">
                    {developer.freeByLabel}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                  <FolderKanban className="size-3.5 text-muted-foreground" aria-hidden />
                  Project Breakdown
                </h3>
                {developer.projects.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground">
                    No remaining work to break down.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {developer.projects.map((entry) => (
                      <div key={entry.projectId}>
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]">
                          <span className="min-w-0 truncate font-medium text-foreground">
                            {entry.key}
                            <span className="ml-1.5 font-normal text-muted-foreground">
                              {entry.name}
                            </span>
                          </span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {entry.remainingHours}h · {entry.sharePercent}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${entry.sharePercent}%`,
                              backgroundColor: projectColor(entry.key),
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6">
                <h3 className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                  <Clock3 className="size-3.5 text-muted-foreground" aria-hidden />
                  Active Assignments
                  <span className="font-normal text-muted-foreground">
                    ({assignments.length})
                  </span>
                </h3>
                {assignments.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground">
                    No active assignments — available for new work.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="rounded-lg border border-border/70 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium tracking-wide text-muted-foreground">
                              {assignment.issueKey} · {assignment.project.key} ·{" "}
                              {assignment.issueType.name}
                            </p>
                            <p className="truncate text-[13px] text-foreground">
                              {assignment.summary}
                            </p>
                          </div>
                          <AssignmentStatusPill status={assignment.status} />
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-[12px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarClock className="size-3" aria-hidden />
                            Free {assignment.freeByLabel}
                          </span>
                          <span className="tabular-nums">
                            {assignment.remainingHours === null
                              ? "Unestimated"
                              : `${assignment.remainingHours}h remaining`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
