import {
  Activity,
  AlertTriangle,
  Gauge,
  Zap,
} from "lucide-react";

import { AiInsightsCard } from "@/components/dashboard/ai-insights-card";
import { ContributorsTable } from "@/components/dashboard/contributors-table";
import { ExecutiveBrief } from "@/components/dashboard/executive-brief";
import { MetricCard } from "@/components/dashboard/metric-card";
import { TechnologyCard } from "@/components/dashboard/technology-card";
import {
  DeliveryTrendCard,
  ProductivityTrendCard,
} from "@/components/dashboard/trend-charts";
import {
  dashboardGridGap,
  dashboardSectionSpacing,
  dashboardTypography,
} from "@/lib/dashboard-ui";
import type { DashboardData } from "@/services/dashboard/types";
import { cn } from "@/lib/utils";

const KPI_ICONS = {
  "delivery-health": Activity,
  productivity: Zap,
  utilization: Gauge,
  risk: AlertTriangle,
} as const;

interface ExecutiveDashboardProps {
  data: DashboardData;
}

export function ExecutiveDashboard({ data }: ExecutiveDashboardProps) {
  return (
    <div className={cn(dashboardSectionSpacing, "pb-8")}>
      <section>
        <div className="mb-4">
          <h2 className={dashboardTypography.sectionTitle}>Engineering Health</h2>
          <p className={dashboardTypography.sectionDescription}>
            Core indicators of delivery and productivity
          </p>
        </div>
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 ${dashboardGridGap}`}
        >
          {data.kpis.map((kpi) => {
            const Icon = KPI_ICONS[kpi.id];
            return (
              <MetricCard
                key={kpi.id}
                title={kpi.title}
                value={kpi.value}
                icon={Icon}
                status={kpi.status}
                statusLabel={kpi.statusLabel}
                trend={kpi.trend}
                trendLabel={kpi.trendLabel}
                chartColor={kpi.chartColor}
                sparkline={kpi.sparkline}
                valueClassName={kpi.valueClassName}
              />
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className={dashboardTypography.sectionTitle}>Delivery Trends</h2>
          <p className={dashboardTypography.sectionDescription}>
            Monthly delivery and productivity patterns
          </p>
        </div>
        <div className={`grid grid-cols-1 lg:grid-cols-2 ${dashboardGridGap}`}>
          <DeliveryTrendCard trend={data.deliveryTrend} />
          <ProductivityTrendCard trend={data.productivityTrend} />
        </div>
      </section>

      <section className={`grid grid-cols-1 xl:grid-cols-12 ${dashboardGridGap}`}>
        <div className="xl:col-span-7">
          <div className="mb-4">
            <h2 className={dashboardTypography.sectionTitle}>
              Technology Health
            </h2>
            <p className={dashboardTypography.sectionDescription}>
              Performance across engineering teams
            </p>
          </div>
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${dashboardGridGap}`}>
            {data.technologies.map((tech) => (
              <TechnologyCard key={tech.id} {...tech} />
            ))}
          </div>
        </div>
        <div className="xl:col-span-5">
          <div className="mb-4 xl:hidden">
            <h2 className={dashboardTypography.sectionTitle}>
              Top Contributors
            </h2>
          </div>
          <ContributorsTable
            contributors={data.contributors}
            className="h-full"
          />
        </div>
      </section>

      <section className={`grid grid-cols-1 lg:grid-cols-5 ${dashboardGridGap}`}>
        <ExecutiveBrief
          briefItems={data.briefItems}
          className="lg:col-span-3"
        />
        <AiInsightsCard className="lg:col-span-2" />
      </section>
    </div>
  );
}
