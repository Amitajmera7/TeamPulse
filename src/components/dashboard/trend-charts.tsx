"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  dashboardCard,
  dashboardCardContent,
  dashboardCardHeader,
  dashboardTypography,
} from "@/lib/dashboard-ui";
import type { TrendChartData } from "@/services/dashboard/types";
import { cn } from "@/lib/utils";

const gridProps = {
  strokeDasharray: "4 4",
  vertical: false,
  stroke: "var(--border)",
  strokeOpacity: 0.55,
} as const;

const axisTick = {
  fontSize: 12,
  fill: "var(--muted-foreground)",
  fontFamily: "var(--font-inter)",
} as const;

interface DeliveryTrendCardProps {
  trend: TrendChartData;
  className?: string;
}

export function DeliveryTrendCard({ trend, className }: DeliveryTrendCardProps) {
  return (
    <Card className={cn(dashboardCard, className)}>
      <CardHeader
        className={cn(
          dashboardCardHeader,
          "flex flex-row items-start justify-between gap-3 pb-2"
        )}
      >
        <div>
          <CardTitle className={dashboardTypography.cardTitle}>
            {trend.title}
          </CardTitle>
          <CardDescription className={dashboardTypography.description}>
            {trend.description}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled
          className="h-8 gap-1 rounded-lg border-border/70 px-3 text-[13px] font-medium transition-colors duration-200 hover:bg-muted/50"
        >
          {trend.dropdown}
          <ChevronDown className="size-3.5" />
        </Button>
      </CardHeader>
      <CardContent className={cn(dashboardCardContent, "h-[240px]")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={[...trend.data]}
            barSize={24}
            margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
          >
            <CartesianGrid {...gridProps} />
            <XAxis
              dataKey="month"
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.35 }}
              contentStyle={{
                borderRadius: 10,
                border: "1px solid var(--border)",
                fontSize: 13,
                fontFamily: "var(--font-inter)",
              }}
            />
            <Bar
              dataKey="value"
              fill="var(--chart-2)"
              fillOpacity={0.9}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface ProductivityTrendCardProps {
  trend: TrendChartData;
  className?: string;
}

export function ProductivityTrendCard({
  trend,
  className,
}: ProductivityTrendCardProps) {
  return (
    <Card className={cn(dashboardCard, className)}>
      <CardHeader
        className={cn(
          dashboardCardHeader,
          "flex flex-row items-start justify-between gap-3 pb-2"
        )}
      >
        <div>
          <CardTitle className={dashboardTypography.cardTitle}>
            {trend.title}
          </CardTitle>
          <CardDescription className={dashboardTypography.description}>
            {trend.description}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled
          className="h-8 gap-1 rounded-lg border-border/70 px-3 text-[13px] font-medium transition-colors duration-200 hover:bg-muted/50"
        >
          {trend.dropdown}
          <ChevronDown className="size-3.5" />
        </Button>
      </CardHeader>
      <CardContent className={cn(dashboardCardContent, "h-[240px]")}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={[...trend.data]}
            margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="productivityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridProps} />
            <XAxis
              dataKey="month"
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: "1px solid var(--border)",
                fontSize: 13,
                fontFamily: "var(--font-inter)",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--chart-3)"
              strokeWidth={2.75}
              fill="url(#productivityFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
