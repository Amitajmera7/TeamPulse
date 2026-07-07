import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { cn } from "@/lib/utils";

interface LeaderboardSkeletonProps {
  rows?: number;
  className?: string;
}

export function LeaderboardSkeleton({
  rows = 5,
  className,
}: LeaderboardSkeletonProps) {
  return (
    <Card
      className={cn(
        "border border-border ring-0 transition-colors duration-150 hover:border-foreground/15",
        className
      )}
    >
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-sm font-semibold">Developer Rankings</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <TableSkeleton rows={rows} />
      </CardContent>
    </Card>
  );
}
