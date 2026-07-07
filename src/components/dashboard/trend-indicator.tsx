import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { TrendDirection } from "@/types/dashboard";

interface TrendIndicatorProps {
  direction: TrendDirection;
  label: string;
  className?: string;
}

const ICON_MAP = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  neutral: ArrowRight,
} as const;

const TONE_MAP = {
  up: "text-primary",
  down: "text-muted-foreground",
  neutral: "text-muted-foreground",
} as const;

export function TrendIndicator({
  direction,
  label,
  className,
}: TrendIndicatorProps) {
  const Icon = ICON_MAP[direction];

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-[13px] font-normal",
        TONE_MAP[direction],
        className
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
