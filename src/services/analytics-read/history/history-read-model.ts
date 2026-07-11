/**
 * Analytics History Read Model — chart-ready trends for /analytics/history.
 */

import type { TrendChartData } from "@/services/dashboard/types";

/** Supported time-range windows (months). Extensible via query parsing. */
export type AnalyticsHistoryMonths = 3 | 6 | 12;

/**
 * Filter contract — architecture supports future keys without breaking clients.
 */
export interface AnalyticsHistoryFilters {
  readonly months: AnalyticsHistoryMonths;
  readonly technology: string | null;
  readonly developer: string | null;
  /** Reserved for future filter expansion (ignored today). */
  readonly extras?: Readonly<Record<string, string | null>>;
}

export type HistorySeriesCompleteness =
  | "full"
  | "partial"
  | "single-point"
  | "empty";

export interface AnalyticsHistoryReadModel {
  readonly filters: AnalyticsHistoryFilters;
  readonly engineeringScoreTrend: TrendChartData;
  readonly technologyHealthTrends: readonly TrendChartData[];
  readonly engineeringValueDeliveredTrend: TrendChartData;
  readonly recoveryHoursTrend: TrendChartData;
  readonly capacityUtilizationTrend: TrendChartData;
  readonly deliveryEfficiencyTrend: TrendChartData;
  readonly meta: {
    readonly archiveCount: number;
    readonly completeness: HistorySeriesCompleteness;
    readonly limitations: readonly string[];
    readonly filterOptions: {
      readonly technologies: readonly string[];
      readonly developers: readonly string[];
    };
  };
}
