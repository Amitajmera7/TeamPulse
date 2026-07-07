import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MetricStatus } from "@/types/dashboard";

interface StatusBadgeProps {
  status: MetricStatus;
  label: string;
  className?: string;
}

const VARIANT_MAP: Record<
  MetricStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  healthy: "secondary",
  "on-track": "default",
  attention: "destructive",
  neutral: "outline",
};

const STATUS_CLASS: Record<MetricStatus, string> = {
  healthy: "border-primary/15 bg-primary/8 text-primary",
  "on-track": "border-primary/15 bg-primary/10 text-primary",
  attention: "",
  neutral: "border-border bg-muted/50 text-muted-foreground",
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <Badge
      variant={VARIANT_MAP[status]}
      className={cn(
        "h-6 rounded-md px-2 text-[11px] font-medium tracking-wide",
        STATUS_CLASS[status],
        className
      )}
    >
      {label}
    </Badge>
  );
}
