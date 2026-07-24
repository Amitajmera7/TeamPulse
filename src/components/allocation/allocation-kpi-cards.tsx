import {
  Briefcase,
  CalendarClock,
  FolderKanban,
  Gauge,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { dashboardGridGap } from "@/lib/dashboard-ui";
import type { AllocationKpi, AllocationKpiIcon } from "@/types/allocation";

/**
 * The read model picks a semantic icon slot; the UI owns the icon itself.
 * Adding or removing a KPI is a read-model change — the grid renders however
 * many arrive.
 */
const ICON_BY_SLOT: Record<AllocationKpiIcon, LucideIcon> = {
  availability: UserCheck,
  overload: ShieldAlert,
  workload: Briefcase,
  schedule: CalendarClock,
  confidence: Gauge,
  projects: FolderKanban,
  generic: Briefcase,
};

interface AllocationKpiCardsProps {
  kpis: readonly AllocationKpi[];
}

export function AllocationKpiCards({ kpis }: AllocationKpiCardsProps) {
  if (kpis.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          Where The Team Stands
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          The questions an engineering manager asks first
        </p>
      </div>
      <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 ${dashboardGridGap}`}>
        {kpis.map((kpi) => (
          <MetricCard
            key={kpi.id}
            title={kpi.title}
            value={kpi.value}
            icon={ICON_BY_SLOT[kpi.icon]}
            status={kpi.status}
            statusLabel={kpi.statusLabel}
            trend="neutral"
            trendLabel={kpi.caption}
            sparkline={[]}
          />
        ))}
      </div>
    </section>
  );
}
