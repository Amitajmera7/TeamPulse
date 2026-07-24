import { memo } from "react";
import { ChevronRight, PartyPopper, UserX } from "lucide-react";

import { AssignmentStatusPill, ProjectBadge } from "@/components/allocation/allocation-badges";
import { AllocationLoadChip } from "@/components/allocation/allocation-load-chip";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { AllocationAssignmentGroup } from "@/types/allocation";

function formatHours(value: number | null): string {
  return value === null ? "—" : `${value}h`;
}

interface AllocationTableGroupProps {
  group: AllocationAssignmentGroup;
  expanded: boolean;
  onToggle: (id: string) => void;
}

/**
 * One developer group, or the trailing "Unassigned" group when a Jira
 * instance has active work nobody owns. Header figures come from the
 * developer record — this component never aggregates.
 */
export const AllocationTableGroup = memo(function AllocationTableGroup({
  group,
  expanded,
  onToggle,
}: AllocationTableGroupProps) {
  const { developer, assignments } = group;

  return (
    <>
      <TableRow
        role="button"
        aria-expanded={expanded}
        onClick={() => onToggle(group.id)}
        className="cursor-pointer border-border/60 bg-muted/25 hover:bg-muted/40"
      >
        <TableCell colSpan={2}>
          <div className="flex items-center gap-2">
            <ChevronRight
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground transition-transform",
                expanded && "rotate-90"
              )}
              aria-hidden
            />
            {developer ? (
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                {developer.initials}
              </span>
            ) : (
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                <UserX className="size-3.5 text-muted-foreground" aria-hidden />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-foreground">{group.label}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {developer
                  ? developer.technology ?? developer.team ?? "No technology set"
                  : "Active work without an assignee"}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          {developer ? (
            <AllocationLoadChip status={developer.status} label={developer.statusLabel} />
          ) : (
            <StatusBadge status="neutral" label="Unassigned" />
          )}
        </TableCell>
        <TableCell />
        <TableCell className="text-right tabular-nums text-[13px] text-muted-foreground">
          {assignments.length} issue{assignments.length === 1 ? "" : "s"}
        </TableCell>
        <TableCell className="text-right text-[13px] font-semibold tabular-nums text-foreground">
          {developer ? `${developer.remainingHours}h` : "—"}
        </TableCell>
        <TableCell className="text-[13px] text-muted-foreground">
          {developer ? developer.freeByLabel : "—"}
        </TableCell>
      </TableRow>

      {expanded && assignments.length === 0 && (
        <TableRow className="border-border/60 hover:bg-transparent">
          <TableCell colSpan={7} className="py-6 text-center">
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
              <PartyPopper className="size-4" aria-hidden />
              <p className="text-[13px]">No active assignments — available for new work.</p>
            </div>
          </TableCell>
        </TableRow>
      )}

      {expanded &&
        assignments.map((assignment) => (
          <TableRow key={assignment.id} className="border-border/60">
            <TableCell className="pl-11">
              <div className="min-w-0">
                <p className="text-[12px] font-medium tracking-wide text-muted-foreground">
                  {assignment.issueKey} · {assignment.issueType.name}
                </p>
                <p className="truncate text-[13px] text-foreground">{assignment.summary}</p>
              </div>
            </TableCell>
            <TableCell>
              <ProjectBadge project={assignment.project} />
            </TableCell>
            <TableCell>
              <AssignmentStatusPill status={assignment.status} />
            </TableCell>
            <TableCell className="text-right tabular-nums text-[13px] text-muted-foreground">
              {formatHours(assignment.estimateHours)}
            </TableCell>
            <TableCell className="text-right tabular-nums text-[13px] text-muted-foreground">
              {assignment.loggedHours}h
            </TableCell>
            <TableCell className="text-right tabular-nums text-[13px] font-semibold text-foreground">
              {formatHours(assignment.remainingHours)}
            </TableCell>
            <TableCell className="text-[13px] text-muted-foreground">
              {assignment.freeByLabel}
            </TableCell>
          </TableRow>
        ))}
    </>
  );
});
