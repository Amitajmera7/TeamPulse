import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
import type { ContributorRow } from "@/services/dashboard/types";
import { cn } from "@/lib/utils";

function MetricBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex min-w-[120px] items-center gap-2.5">
      <span className="w-7 text-[13px] font-semibold tabular-nums text-foreground">
        {value}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/80">
        <div
          className="h-full rounded-full bg-primary/90 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface ContributorsTableProps {
  contributors: ContributorRow[];
  className?: string;
}

export function ContributorsTable({
  contributors,
  className,
}: ContributorsTableProps) {
  return (
    <Card className={cn(dashboardCard, "h-full", className)}>
      <CardHeader
        className={cn(
          dashboardCardHeader,
          "flex flex-row items-center justify-between pb-3"
        )}
      >
        <CardTitle className={dashboardTypography.cardTitle}>
          Top Contributors
        </CardTitle>
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-primary transition-colors duration-200 hover:text-primary/80"
        >
          View leaderboard
          <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent className={cn(dashboardCardContent, "pt-0")}>
        {contributors.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-muted-foreground">
            No contributor data available for this period.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="h-10 px-3 text-[13px] font-medium text-muted-foreground">
                  Developer
                </TableHead>
                <TableHead className="h-10 px-3 text-[13px] font-medium text-muted-foreground">
                  Stories
                </TableHead>
                <TableHead className="hidden h-10 px-3 text-[13px] font-medium text-muted-foreground sm:table-cell">
                  Work Logged
                </TableHead>
                <TableHead className="h-10 px-3 text-[13px] font-medium text-muted-foreground">
                  Efficiency
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contributors.map((row) => (
                <TableRow
                  key={row.name}
                  className="border-border/60 transition-colors duration-150 hover:bg-muted/30"
                >
                  <TableCell className="px-3 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-primary/10 text-[13px] font-semibold text-primary">
                        {row.initials}
                      </span>
                      <span className="text-[15px] font-medium text-foreground">
                        {row.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-3.5">
                    <MetricBar value={row.stories} max={row.storiesMax} />
                  </TableCell>
                  <TableCell className="hidden px-3 py-3.5 sm:table-cell">
                    <MetricBar value={row.hours} max={row.hoursMax} />
                  </TableCell>
                  <TableCell className="px-3 py-3.5">
                    <div className="flex min-w-[120px] items-center gap-2.5">
                      <span className="w-9 text-[13px] font-semibold tabular-nums text-foreground">
                        {row.efficiency}%
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/80">
                        <div
                          className="h-full rounded-full bg-primary/90 transition-all duration-300"
                          style={{ width: `${row.efficiency}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
