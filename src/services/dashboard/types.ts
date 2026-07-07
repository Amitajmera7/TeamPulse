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
  sparkline: number[];
  chartColor: string;
}

export interface BriefItem {
  id: string;
  title: string;
  description: string;
  tone: "success" | "warning" | "info";
}

export interface HealthMetrics {
  deliveryHealth: number;
  productivity: number;
  utilization: number;
  riskCount: number;
  deliverySparkline: number[];
  productivitySparkline: number[];
  utilizationSparkline: number[];
  riskSparkline: number[];
}

export interface DashboardData {
  engineeringScore: EngineeringScoreData;
  kpis: DashboardKpiData[];
  deliveryTrend: TrendChartData;
  productivityTrend: TrendChartData;
  technologies: TechnologyCardData[];
  contributors: ContributorRow[];
  briefItems: BriefItem[];
  updatedAt: string;
}
