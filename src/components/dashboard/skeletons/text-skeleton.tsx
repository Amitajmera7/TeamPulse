import { cn } from "@/lib/utils";

interface TextSkeletonProps {
  lines?: number;
  className?: string;
}

export function TextSkeleton({ lines = 3, className }: TextSkeletonProps) {
  const widths = ["w-full", "w-5/6", "w-4/6", "w-3/4"];

  return (
    <div className={cn("space-y-2", className)} aria-hidden>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-2.5 animate-pulse rounded-md bg-muted",
            widths[index % widths.length]
          )}
        />
      ))}
    </div>
  );
}
