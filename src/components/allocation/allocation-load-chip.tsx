import { CheckCircle2, Flame, Gauge, Sparkles } from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import type { AllocationLoadStatus } from "@/types/allocation";
import type { MetricStatus } from "@/types/dashboard";

const LOAD_BADGE_STATUS: Record<AllocationLoadStatus, MetricStatus> = {
  available: "healthy",
  light: "on-track",
  busy: "neutral",
  overloaded: "attention",
};

const LOAD_ICON = {
  available: CheckCircle2,
  light: Sparkles,
  busy: Gauge,
  overloaded: Flame,
} as const;

interface AllocationLoadChipProps {
  status: AllocationLoadStatus;
  label: string;
  className?: string;
}

/** Shared load → chip mapping so occupancy cards and table groups stay in sync. */
export function AllocationLoadChip({
  status,
  label,
  className,
}: AllocationLoadChipProps) {
  return (
    <StatusBadge status={LOAD_BADGE_STATUS[status]} label={label} className={className} />
  );
}

export function getAllocationLoadIcon(status: AllocationLoadStatus) {
  return LOAD_ICON[status];
}

export function getAllocationLoadBadgeStatus(
  status: AllocationLoadStatus
): MetricStatus {
  return LOAD_BADGE_STATUS[status];
}
