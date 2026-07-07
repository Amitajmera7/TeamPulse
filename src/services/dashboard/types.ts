import type {
  MetricStatus,
  TrendDirection,
} from "@/types/dashboard";

export interface ApiDeveloperMetric {
  developer: string;
  technology: string;
  actualHours: number;
  estimatedHours: number;
  worklogCount: number;
  efficiency: number;
}

export interface ApiContributionMetric {
  developer: string;
  deliveredHours: number;
  deliveredTickets: number;
}

export interface EngineeringScoreData {
  value: number;
  trend: string;
  status: string;
  sparkline: number[];
}

/** Normalized 0–100 inputs used by the engineering score formula. */
export interface ScoreComponents {
  deliveryHealth: number;
  productivity: number;
  quality: number;
  contribution: number;
  utilization: number;
  riskHealth: number;
}

export interface DashboardKpiData {
  id: "delivery-health" | "productivity" | "utilization" | "risk";
  title: string;
  value: string;
  status: MetricStatus;
  statusLabel: string;
  trend: TrendDirection;
  trendLabel: string;
  chartColor: string;
  sparkline: number[];
  valueClassName?: string;
  badge?: string;
}

export interface TrendChartData {
  title: string;
  description: string;
  dropdown: string;
  data: Array<{ month: string; value: number }>;
}

export interface ContributorRow {
  name: string;
  initials: string;
  stories: number;
  storiesMax: number;
  hours: number;
  hoursMax: number;
  efficiency: number;
}

export interface TechnologyCardData {
  id: string;
  name: string;
  status: MetricStatus;
  statusLabel: string;
  developers: number;
  hours: number;
  stories: number;
  /** Team average estimate efficiency (estimatedHours / actualHours). */
  efficiency: number;
  sparkline: number[];
  chartColor: string;
  healthScore: number;
}

export interface EngineeringInsight {
  id: string;
  title: string;
  description: string;
  tone: "success" | "warning" | "info";
}

export interface HealthMetrics {
  deliveryHealth: number;
  productivity: number;
  quality: number;
  contribution: number;
  /** Activity coverage (% of roster with logged work). Beta proxy for utilization. */
  utilizationParticipation: number;
  riskCount: number;
  deliverySparkline: number[];
  productivitySparkline: number[];
  qualitySparkline: number[];
  contributionSparkline: number[];
  utilizationSparkline: number[];
  riskSparkline: number[];
}

export interface ReportingPeriod {
  /** Human-readable month label, e.g. "July 2026". */
  month: string;
  /** ISO-8601 start of the reporting period. */
  from: string;
  /** ISO-8601 end of the reporting period. */
  to: string;
}

/**
 * Central dashboard object returned by the aggregator.
 * All UI sections consume slices of this structure.
 */
export interface DashboardData {
  engineeringScore: EngineeringScoreData;
  scoreComponents: ScoreComponents;
  kpis: DashboardKpiData[];
  deliveryTrend: TrendChartData;
  productivityTrend: TrendChartData;
  technologies: TechnologyCardData[];
  contributors: ContributorRow[];
  insights: EngineeringInsight[];
  reportingPeriod: ReportingPeriod;
  updatedAt: string;
}

/**
 * Engineering Score component weights (must sum to 1.0).
 *
 * @see calculate-score.ts for the full formula documentation.
 */
export const SCORE_WEIGHTS = {
  deliveryHealth: 0.25,
  productivity: 0.25,
  quality: 0.2,
  contribution: 0.15,
  utilization: 0.1,
  risk: 0.05,
} as const;
