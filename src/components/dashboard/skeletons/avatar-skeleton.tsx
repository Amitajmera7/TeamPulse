import { cn } from "@/lib/utils";

interface AvatarSkeletonProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: "size-7",
  md: "size-9",
  lg: "size-11",
} as const;

export function AvatarSkeleton({
  size = "md",
  className,
}: AvatarSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-full bg-muted",
        SIZE_MAP[size],
        className
      )}
      aria-hidden
    />
  );
}
