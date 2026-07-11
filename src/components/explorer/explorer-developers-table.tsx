"use client";

import { useRouter } from "next/navigation";

import { SparklineChart } from "@/components/dashboard/sparkline-chart";
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
import type { ExplorerDeveloperListItem } from "@/services/analytics-read/explorer";
import { cn } from "@/lib/utils";

function formatNum(value: number | null, suffix = ""): string {
  if (value === null) {
    return "—";
  }
  const text = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${text}${suffix}`;
}

interface ExplorerDevelopersTableProps {
  developers: readonly ExplorerDeveloperListItem[];
}

export function ExplorerDevelopersTable({
  developers,
}: ExplorerDevelopersTableProps) {
  const router = useRouter();

  return (
    <Card className={dashboardCard}>
      <CardHeader className={dashboardCardHeader}>
        <CardTitle className={dashboardTypography.cardTitle}>
          Developers
        </CardTitle>
        <p className={dashboardTypography.description}>
          Click a row to open developer detail
        </p>
      </CardHeader>
      <CardContent className={cn(dashboardCardContent, "pt-0")}>
        {developers.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-muted-foreground">
            No developers in the completed Analytics Snapshot.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead>Developer</TableHead>
                  <TableHead>Technology</TableHead>
                  <TableHead className="text-right">
                    Engineering Value Delivered
                  </TableHead>
                  <TableHead className="text-right">Recovery Hours</TableHead>
                  <TableHead className="text-right">Capacity</TableHead>
                  <TableHead className="text-right">
                    Delivery Efficiency
                  </TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {developers.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer border-border/60 hover:bg-muted/40"
                    onClick={() =>
                      router.push(
                        `/explorer/developers/${encodeURIComponent(row.id)}`
                      )
                    }
                  >
                    <TableCell className="text-[13px] font-medium">
                      {row.name}
                    </TableCell>
                    <TableCell className="text-[13px]">
                      {row.technology || "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[13px]">
                      {formatNum(row.deliveredHours, "h")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[13px]">
                      {formatNum(row.recoveryHours, "h")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[13px]">
                      {formatNum(row.capacityUtilization)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-[13px]">
                      {formatNum(row.deliveryEfficiency)}
                    </TableCell>
                    <TableCell>
                      <SparklineChart
                        data={row.trend}
                        color="var(--chart-2)"
                        height={28}
                      />
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
