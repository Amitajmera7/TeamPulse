"use client";

import { useMemo, useState } from "react";

import { ActiveAssignmentsTable } from "@/components/allocation/active-assignments-table";
import { AllocationEmptyState } from "@/components/allocation/allocation-empty-state";
import { AllocationErrorState } from "@/components/allocation/allocation-error-state";
import { AllocationFilters } from "@/components/allocation/allocation-filters";
import { AllocationHero } from "@/components/allocation/allocation-hero";
import { AllocationKpiCards } from "@/components/allocation/allocation-kpi-cards";
import { AllocationPageSkeleton } from "@/components/allocation/allocation-skeletons";
import { DeveloperOccupancyGrid } from "@/components/allocation/developer-occupancy-grid";
import { TeamCapacitySnapshot } from "@/components/allocation/team-capacity-snapshot";
import { WorkloadDetailDrawer } from "@/components/allocation/workload-detail-drawer";
import { PageContainer } from "@/components/common/layout/page-container";
import { useAllocationModel } from "@/hooks/allocation/use-allocation-model";
import { dashboardSectionSpacing } from "@/lib/dashboard-ui";
import type { AllocationReadModel, AllocationSummary } from "@/types/allocation";

const LOADING_SUMMARY: AllocationSummary = {
  headline: "Loading team allocation…",
  lastUpdatedLabel: "—",
  workingDayLabel: "—",
  dataSourceLabel: "—",
};

/**
 * Composition root for the Allocation page. It owns exactly two things:
 * which developer's drawer is open, and how the read model's status maps to
 * a state component. Every child receives read-model objects.
 */
export function AllocationView() {
  const { status, model, error, retry } = useAllocationModel();
  const [selectedDeveloperId, setSelectedDeveloperId] = useState<string | null>(null);

  const selectedDeveloper = useMemo(
    () => model?.developers.find((developer) => developer.id === selectedDeveloperId) ?? null,
    [model, selectedDeveloperId]
  );

  const selectedAssignments = useMemo(
    () =>
      selectedDeveloperId && model
        ? model.assignments.filter(
            (assignment) => assignment.assignee?.id === selectedDeveloperId
          )
        : [],
    [model, selectedDeveloperId]
  );

  return (
    <>
      <AllocationHero summary={model?.summary ?? LOADING_SUMMARY} />

      <PageContainer className={dashboardSectionSpacing}>
        {model && <AllocationFilters options={model.filterOptions} />}

        {status === "loading" && <AllocationPageSkeleton />}
        {status === "error" && <AllocationErrorState message={error} onRetry={retry} />}
        {status === "empty" && <AllocationEmptyState />}
        {status === "ready" && model && <AllocationBody model={model} onSelect={setSelectedDeveloperId} />}
      </PageContainer>

      <WorkloadDetailDrawer
        developer={selectedDeveloper}
        assignments={selectedAssignments}
        open={selectedDeveloperId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDeveloperId(null);
          }
        }}
      />
    </>
  );
}

function AllocationBody({
  model,
  onSelect,
}: {
  model: AllocationReadModel;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <AllocationKpiCards kpis={model.kpis} />
      <TeamCapacitySnapshot capacity={model.capacity} />
      <DeveloperOccupancyGrid
        developers={model.developers}
        loadBands={model.capacity.loadBands}
        onSelect={onSelect}
      />
      <ActiveAssignmentsTable
        developers={model.developers}
        assignments={model.assignments}
        totals={model.totals}
        unassignedCount={model.meta.unassignedAssignments}
      />
    </>
  );
}
