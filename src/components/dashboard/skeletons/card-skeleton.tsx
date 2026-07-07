import { cn } from "@/lib/utils";

interface CardSkeletonProps {
  rows?: number;
  className?: string;
}

export function CardSkeleton({ rows = 3, className }: CardSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)} aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-8 animate-pulse rounded-lg bg-muted"
          style={{ width: `${100 - index * 15}%` }}
        />
      ))}
    </div>
  );
}
