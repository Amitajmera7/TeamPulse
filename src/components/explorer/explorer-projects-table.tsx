"use client";

import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  dashboardCard,
  dashboardCardContent,
  dashboardCardHeader,
  dashboardTypography,
} from "@/lib/dashboard-ui";
import type { ExplorerProjectListItem } from "@/services/analytics-read/explorer";
import { cn } from "@/lib/utils";

function formatNum(value: number | null, suffix = ""): string {
  if (value === null) {
    return "—";
  }
  const text = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${text}${suffix}`;
}

interface ExplorerProjectsTableProps {
  projects: readonly ExplorerProjectListItem[];
}

export function ExplorerProjectsTable({ projects }: ExplorerProjectsTableProps) {
  const router = useRouter();

  return (
    <Card className={dashboardCard}>
      <CardHeader className={dashboardCardHeader}>
        <CardTitle className={dashboardTypography.cardTitle}>Projects</CardTitle>
        <p className={dashboardTypography.description}>
          EAW project facts · Engineering Score unavailable by project
        </p>
      </CardHeader>
      <CardContent className={cn(dashboardCardContent, "pt-0")}>
        {projects.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-muted-foreground">
            No project facts available. Configure warehouse persistence and run
            sync.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Issues</TableHead>
                  <TableHead className="text-right">Stories</TableHead>
                  <TableHead className="text-right">Engineering Hours</TableHead>
                  <TableHead className="text-right">Engineering Score</TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer border-border/60 hover:bg-muted/40"
                    onClick={() =>
                      router.push(
                        `/explorer/projects/${encodeURIComponent(row.id)}`
                      )
                    }
                  >
                    <TableCell className="text-[13px] font-medium">
                      {row.projectKey}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[13px]">
                      {row.issues}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[13px]">
                      {row.stories}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[13px]">
                      {formatNum(row.engineeringHours, "h")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[13px]">
                      {formatNum(row.engineeringScore)}
                    </TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">
                      —
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
