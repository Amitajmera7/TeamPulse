"use client";

import { useCallback, useState } from "react";
import { ArrowUpDown, Search } from "lucide-react";

import { AllocationTableGroup } from "@/components/allocation/allocation-table-group";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAssignmentGroups } from "@/hooks/allocation/use-assignment-groups";
import { dashboardCard, dashboardTypography } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";
import type {
  AllocationAssignment,
  AllocationDeveloper,
  AllocationTotals,
} from "@/types/allocation";

function SortableHead({
  label,
  align = "left",
}: {
  label: string;
  align?: "left" | "right";
}) {
  return (
    <TableHead className={cn(align === "right" && "text-right")}>
      <span
        className={cn(
          "inline-flex items-center gap-1",
          align === "right" && "flex-row-reverse"
        )}
      >
        {label}
        <ArrowUpDown className="size-3 text-muted-foreground/60" aria-hidden />
      </span>
    </TableHead>
  );
}

interface ActiveAssignmentsTableProps {
  developers: readonly AllocationDeveloper[];
  assignments: readonly AllocationAssignment[];
  totals: AllocationTotals;
  unassignedCount: number;
}

export function ActiveAssignmentsTable({
  developers,
  assignments,
  totals,
  unassignedCount,
}: ActiveAssignmentsTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const groups = useAssignmentGroups(developers, assignments);

  const toggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <section>
      <div className="mb-4">
        <h2 className={dashboardTypography.sectionTitle}>Active Assignments</h2>
        <p className={dashboardTypography.sectionDescription}>
          Evidence behind every number above — grouped by developer, collapsed by default
        </p>
      </div>

      <Card className={dashboardCard}>
        <CardHeader className="flex flex-col gap-3 border-b border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search assignments…"
              aria-label="Search assignments"
              className="h-9 w-full rounded-lg border border-border/70 bg-background pl-8 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            />
          </div>
          <p className="text-[12px] text-muted-foreground">
            {totals.assignmentCount} assignments · {groups.length} groups
            {unassignedCount > 0 ? ` · ${unassignedCount} unassigned` : ""}
          </p>
        </CardHeader>

        <CardContent className="p-0">
          {groups.length === 0 ? (
            <p className="py-12 text-center text-[13px] text-muted-foreground">
              No active assignments. The whole team has open capacity.
            </p>
          ) : (
            <div className="max-h-[560px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <SortableHead label="Assignment" />
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <SortableHead label="Estimate" align="right" />
                    <SortableHead label="Logged" align="right" />
                    <SortableHead label="Remaining" align="right" />
                    <SortableHead label="Free By" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <AllocationTableGroup
                      key={group.id}
                      group={group}
                      expanded={expandedIds.has(group.id)}
                      onToggle={toggle}
                    />
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="font-semibold text-foreground">Total</TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell className="text-right tabular-nums font-semibold text-foreground">
                      {totals.estimateHours}h
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-foreground">
                      {totals.loggedHours}h
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-foreground">
                      {totals.remainingHours}h
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
