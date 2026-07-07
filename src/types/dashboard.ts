import type { LucideIcon } from "lucide-react";

/* ==========================================
   Existing Business Types
========================================== */

export interface DeveloperMetric {
  developer: string;

  estimatedHours: number;
  actualHours: number;

  deliveredHours: number;

  qaBugHours: number;
  uatBugHours: number;

  efficiency: number;
  quality: number;
  contribution: number;
  compliance: number;

  overall: number;
}

/* ==========================================
   Dashboard UI Types
========================================== */

export interface TrendCardProps {
  title: string;
  description?: string;
  className?: string;
}

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export type MetricStatus =
  | "healthy"
  | "on-track"
  | "attention"
  | "neutral";

export type TrendDirection =
  | "up"
  | "down"
  | "neutral";

export interface MetricCardProps {
  title: string;

  value: string | number;

  icon: LucideIcon;

  status: MetricStatus;

  statusLabel: string;

  trend?: TrendDirection;

  trendLabel?: string;

  chartColor?: string;

  sparkline?: readonly number[];

  valueClassName?: string;

  badge?: string;

  className?: string;
}

export interface TechnologyCardProps {
  id: string;
  name: string;

  status: MetricStatus;
  statusLabel: string;

  developers: number;
  hours: number;
  stories: number;

  sparkline: readonly number[];

  chartColor?: string;

  /** Present in DashboardData; not rendered by the card yet. */
  efficiency?: number;

  className?: string;
}

export interface TrendIndicatorProps {
  direction: TrendDirection;
  label: string;
  className?: string;
}

export interface StatusBadgeProps {
  status: MetricStatus;
  label: string;
  className?: string;
}