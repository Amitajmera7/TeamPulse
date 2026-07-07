import { AvatarSkeleton } from "@/components/dashboard/skeletons/avatar-skeleton";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  rows?: number;
  className?: string;
}

export function TableSkeleton({ rows = 5, className }: TableSkeletonProps) {
  return (
    <div className={cn("divide-y divide-border", className)} aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
        >
          <AvatarSkeleton size="md" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-32 animate-pulse rounded-md bg-muted" />
            <div className="h-2 w-20 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}
