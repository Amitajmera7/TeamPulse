import { LOAD_STATUS_COLOR, projectColor } from "@/components/allocation/allocation-palette";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  dashboardCard,
  dashboardCardContent,
  dashboardCardHeader,
  dashboardTypography,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";
import type { AllocationCapacitySnapshot } from "@/types/allocation";

interface TeamCapacitySnapshotProps {
  capacity: AllocationCapacitySnapshot;
  /** Keeps the list readable when an instance has dozens of projects. */
  maxVisibleProjects?: number;
}

export function TeamCapacitySnapshot({
  capacity,
  maxVisibleProjects = 8,
}: TeamCapacitySnapshotProps) {
  const bands = capacity.loadBands.filter((band) => band.developerCount > 0);
  const bandTotal = bands.reduce((sum, band) => sum + band.developerCount, 0);
  const activeProjects = capacity.projects.filter((project) => project.assignmentCount > 0);
  const visibleProjects = activeProjects.slice(0, maxVisibleProjects);
  const hiddenProjectCount = activeProjects.length - visibleProjects.length;

  return (
    <section>
      <div className="mb-4">
        <h2 className={dashboardTypography.sectionTitle}>Team Capacity Snapshot</h2>
        <p className={dashboardTypography.sectionDescription}>
          Overall remaining work and where it sits across the portfolio
        </p>
      </div>

      <Card className={dashboardCard}>
        <CardHeader className={dashboardCardHeader}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className={dashboardTypography.label}>Total Remaining</p>
              <p className={cn(dashboardTypography.metricValue, "mt-1 text-foreground")}>
                {capacity.totalRemainingHours}h
              </p>
            </div>
            <p className="text-[13px] text-muted-foreground">
              ≈ {capacity.totalRemainingDays} working days · {capacity.activeAssignments} assigned
              issues · {capacity.developerCount} developers · working day ={" "}
              {capacity.workingDayHours}h
            </p>
          </div>
        </CardHeader>

        <CardContent className={cn(dashboardCardContent, "space-y-6 pt-4")}>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div>
              <CardTitle className="mb-3 text-[13px] font-semibold text-foreground">
                Load Distribution
              </CardTitle>
              {bands.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">No developers in scope.</p>
              ) : (
                <>
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                    {bands.map((band) => (
                      <div
                        key={band.status}
                        style={{
                          width: `${(band.developerCount / Math.max(bandTotal, 1)) * 100}%`,
                          backgroundColor: LOAD_STATUS_COLOR[band.status],
                        }}
                        title={`${band.label}: ${band.developerCount}`}
                      />
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                    {bands.map((band) => (
                      <div key={band.status} className="flex items-center gap-2">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: LOAD_STATUS_COLOR[band.status] }}
                          aria-hidden
                        />
                        <span className="text-[13px] text-foreground">
                          {band.label}
                          <span className="ml-1 text-muted-foreground">
                            {band.developerCount}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div>
              <CardTitle className="mb-3 text-[13px] font-semibold text-foreground">
                Project Consumption
              </CardTitle>
              {visibleProjects.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">
                  No project has remaining assigned work.
                </p>
              ) : (
                <div className="space-y-3">
                  {visibleProjects.map((project) => (
                    <div key={project.id}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]">
                        <span className="min-w-0 truncate font-medium text-foreground">
                          {project.key}
                          <span className="ml-1.5 font-normal text-muted-foreground">
                            {project.name}
                          </span>
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {project.remainingHours}h · {project.sharePercent}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${project.sharePercent}%`,
                            backgroundColor: projectColor(project.key),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {hiddenProjectCount > 0 && (
                    <p className="pt-1 text-[12px] text-muted-foreground">
                      +{hiddenProjectCount} more project
                      {hiddenProjectCount === 1 ? "" : "s"} with remaining work
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
