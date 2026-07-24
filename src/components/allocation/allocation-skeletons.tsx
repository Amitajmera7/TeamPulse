import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  CardSkeleton,
  ChartSkeleton,
  TableSkeleton,
} from "@/components/dashboard/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardCard, dashboardGridGap, dashboardSectionSpacing } from "@/lib/dashboard-ui";

function KpiCardSkeleton() {
  return (
    <Card className={dashboardCard}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 pt-5 pb-1">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-5 w-16 rounded-md" />
      </CardHeader>
      <CardContent className="space-y-3 px-5 pb-5 pt-3">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

interface AllocationPageSkeletonProps {
  /** Placeholder counts only — the real counts come from the read model. */
  kpiCount?: number;
  developerCardCount?: number;
}

/** Full-page loading state shown while the allocation read model resolves. */
export function AllocationPageSkeleton({
  kpiCount = 6,
  developerCardCount = 4,
}: AllocationPageSkeletonProps = {}) {
  return (
    <div className={dashboardSectionSpacing} aria-busy aria-live="polite">
      <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 ${dashboardGridGap}`}>
        {Array.from({ length: kpiCount }).map((_, index) => (
          <KpiCardSkeleton key={index} />
        ))}
      </div>

      <Card className={dashboardCard}>
        <CardContent className="p-5">
          <ChartSkeleton />
        </CardContent>
      </Card>

      <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 ${dashboardGridGap}`}>
        {Array.from({ length: developerCardCount }).map((_, index) => (
          <Card key={index} className={dashboardCard}>
            <CardContent className="p-5">
              <CardSkeleton rows={4} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className={dashboardCard}>
        <CardContent className="p-5">
          <TableSkeleton rows={6} />
        </CardContent>
      </Card>
    </div>
  );
}
