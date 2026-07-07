import { cn } from "@/lib/utils";

interface ChartSkeletonProps {
  className?: string;
}

const BAR_HEIGHTS = [40, 65, 45, 80, 55, 70, 50, 85, 60, 75, 48, 68];

export function ChartSkeleton({ className }: ChartSkeletonProps) {
  return (
    <div
      className={cn("flex h-[120px] flex-col justify-end gap-2", className)}
      aria-hidden
    >
      <div className="flex h-full items-end justify-between gap-1.5 px-0.5">
        {BAR_HEIGHTS.map((height, index) => (
          <div
            key={index}
            className="w-full animate-pulse rounded-sm bg-muted"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between border-t border-border pt-1.5">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-2 w-7 animate-pulse rounded-sm bg-muted" />
        ))}
      </div>
    </div>
  );
}
