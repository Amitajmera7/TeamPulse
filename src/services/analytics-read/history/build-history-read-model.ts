/**
 * Builds AnalyticsHistoryReadModel from snapshot archive (no formula engines).
 */

import { format, startOfMonth, subMonths } from "date-fns";

import type { TrendChartData } from "@/services/dashboard/types";
import { TECHNOLOGY_NAMES } from "@/services/technology-profile";
import { weightedAverage } from "@/services/technology-profile";

import { getSnapshotHistoryEntries } from "./snapshot-history-store";
import type {
  AnalyticsHistoryFilters,
  AnalyticsHistoryReadModel,
  HistorySeriesCompleteness,
} from "./history-read-model";
import type { SnapshotHistoryEntry } from "./types";

function monthLabelShort(date: Date): string {
  return format(date, "MMM");
}

function periodKey(monthLabel: string): string {
  return monthLabel;
}

function buildMonthBuckets(months: number): { label: string; key: string }[] {
  const now = new Date();
  return Array.from({ length: months }, (_, index) => {
    const date = startOfMonth(subMonths(now, months - 1 - index));
    const label = monthLabelShort(date);
    return { label, key: format(date, "MMMM yyyy") };
  });
}

function filterEntries(
  entries: readonly SnapshotHistoryEntry[],
  filters: AnalyticsHistoryFilters
): SnapshotHistoryEntry[] {
  return entries.filter((entry) => {
    if (filters.technology) {
      const tech = filters.technology.toLowerCase();
      const hasTech = entry.technologies.some(
        (slice) =>
          slice.technology.toLowerCase() === tech ||
          slice.technology.toLowerCase().includes(tech)
      );
      if (!hasTech) {
        return false;
      }
    }

    if (filters.developer) {
      const name = filters.developer.toLowerCase();
      const hasDev = entry.developers.some(
        (slice) => slice.developer.toLowerCase() === name
      );
      if (!hasDev) {
        return false;
      }
    }

    return true;
  });
}

function resolvePoint(
  entry: SnapshotHistoryEntry,
  filters: AnalyticsHistoryFilters,
  metric:
    | "engineeringScore"
    | "engineeringValueDeliveredHours"
    | "recoveryHours"
    | "capacityUtilization"
    | "deliveryEfficiency"
): number | null {
  if (filters.developer) {
    const name = filters.developer.toLowerCase();
    const developers = entry.developers.filter(
      (slice) => slice.developer.toLowerCase() === name
    );
    if (developers.length === 0) {
      return null;
    }

    if (metric === "engineeringScore") {
      return weightedAverage(
        developers
          .filter((d) => d.engineeringScore !== null)
          .map((d) => ({
            value: d.engineeringScore as number,
            weight: Math.max(d.deliveredEngineeringHours, 1),
          }))
      );
    }
    if (metric === "engineeringValueDeliveredHours") {
      return developers.reduce((sum, d) => sum + d.deliveredEngineeringHours, 0);
    }
    if (metric === "recoveryHours") {
      return developers.reduce((sum, d) => sum + d.recoveryHours, 0);
    }
    if (metric === "capacityUtilization") {
      return weightedAverage(
        developers
          .filter((d) => d.capacityUtilization !== null)
          .map((d) => ({
            value: d.capacityUtilization as number,
            weight: Math.max(d.deliveredEngineeringHours, 1),
          }))
      );
    }
    return weightedAverage(
      developers
        .filter((d) => d.deliveryEfficiency !== null)
        .map((d) => ({
          value: d.deliveryEfficiency as number,
          weight: Math.max(d.deliveredEngineeringHours, 1),
        }))
    );
  }

  if (filters.technology) {
    const tech = filters.technology.toLowerCase();
    const slices = entry.technologies.filter(
      (slice) =>
        slice.technology.toLowerCase() === tech ||
        slice.technology.toLowerCase().includes(tech)
    );
    if (slices.length === 0) {
      return null;
    }
    const slice = slices[0];
    if (metric === "engineeringScore" || metric === "capacityUtilization") {
      return slice.engineeringHealth;
    }
    if (metric === "engineeringValueDeliveredHours") {
      return slice.engineeringValueDeliveredHours;
    }
    if (metric === "recoveryHours") {
      return slice.recoveryHours;
    }
    return slice.execution;
  }

  return entry[metric];
}

function toTrend(
  title: string,
  description: string,
  dropdown: string,
  buckets: { label: string; key: string }[],
  entriesByPeriod: Map<string, SnapshotHistoryEntry>,
  filters: AnalyticsHistoryFilters,
  metric:
    | "engineeringScore"
    | "engineeringValueDeliveredHours"
    | "recoveryHours"
    | "capacityUtilization"
    | "deliveryEfficiency"
): TrendChartData {
  const data: Array<{ month: string; value: number }> = [];

  for (const bucket of buckets) {
    const entry = entriesByPeriod.get(bucket.key);
    if (!entry) {
      continue;
    }
    const value = resolvePoint(entry, filters, metric);
    if (value === null) {
      continue;
    }
    data.push({ month: bucket.label, value: Number(value.toFixed(2)) });
  }

  return { title, description, dropdown, data };
}

function technologyHealthTrends(
  buckets: { label: string; key: string }[],
  entriesByPeriod: Map<string, SnapshotHistoryEntry>,
  filters: AnalyticsHistoryFilters
): TrendChartData[] {
  const techNames = filters.technology
    ? TECHNOLOGY_NAMES.filter(
        (name) =>
          name.toLowerCase() === filters.technology!.toLowerCase() ||
          name.toLowerCase().includes(filters.technology!.toLowerCase())
      )
    : [...TECHNOLOGY_NAMES];

  return techNames.map((technology) => {
    const data: Array<{ month: string; value: number }> = [];

    for (const bucket of buckets) {
      const entry = entriesByPeriod.get(bucket.key);
      if (!entry) {
        continue;
      }

      if (filters.developer) {
        const name = filters.developer.toLowerCase();
        const developers = entry.developers.filter(
          (slice) =>
            slice.developer.toLowerCase() === name &&
            slice.technology === technology
        );
        const score = weightedAverage(
          developers
            .filter((d) => d.engineeringScore !== null)
            .map((d) => ({
              value: d.engineeringScore as number,
              weight: Math.max(d.deliveredEngineeringHours, 1),
            }))
        );
        if (score !== null) {
          data.push({ month: bucket.label, value: Number(score.toFixed(2)) });
        }
        continue;
      }

      const slice = entry.technologies.find((t) => t.technology === technology);
      if (slice?.engineeringHealth != null) {
        data.push({
          month: bucket.label,
          value: Number(slice.engineeringHealth.toFixed(2)),
        });
      }
    }

    return {
      title: `${technology} Health`,
      description: "Technology Engineering Health from archived snapshots",
      dropdown: technology,
      data,
    };
  });
}

function completenessFrom(
  pointCounts: number[],
  months: number
): HistorySeriesCompleteness {
  const maxPoints = Math.max(0, ...pointCounts);
  if (maxPoints === 0) {
    return "empty";
  }
  if (maxPoints === 1) {
    return "single-point";
  }
  if (maxPoints >= months) {
    return "full";
  }
  return "partial";
}

/**
 * Assembles chart-ready history read model from the snapshot archive.
 */
export function buildAnalyticsHistoryReadModel(
  filters: AnalyticsHistoryFilters
): AnalyticsHistoryReadModel {
  const allEntries = getSnapshotHistoryEntries();
  const filtered = filterEntries(allEntries, filters);
  const buckets = buildMonthBuckets(filters.months);

  const entriesByPeriod = new Map<string, SnapshotHistoryEntry>();
  for (const entry of filtered) {
    entriesByPeriod.set(periodKey(entry.reportingPeriod.month), entry);
  }

  const engineeringScoreTrend = toTrend(
    "Engineering Score Trend",
    "Archived Engineering Score by reporting period",
    `${filters.months} Months`,
    buckets,
    entriesByPeriod,
    filters,
    "engineeringScore"
  );

  const engineeringValueDeliveredTrend = toTrend(
    "Engineering Value Delivered Trend",
    "Delivered Engineering Hours by reporting period",
    "Hours",
    buckets,
    entriesByPeriod,
    filters,
    "engineeringValueDeliveredHours"
  );

  const recoveryHoursTrend = toTrend(
    "Recovery Hours Trend",
    "Recovery Hours by reporting period",
    "Hours",
    buckets,
    entriesByPeriod,
    filters,
    "recoveryHours"
  );

  const capacityUtilizationTrend = toTrend(
    "Capacity Utilization Trend",
    "Contribution/capacity score from archived Engineering Score components",
    "Percent",
    buckets,
    entriesByPeriod,
    filters,
    "capacityUtilization"
  );

  const deliveryEfficiencyTrend = toTrend(
    "Delivery Efficiency Trend",
    "Execution Efficiency from archived profiles",
    "Score",
    buckets,
    entriesByPeriod,
    filters,
    "deliveryEfficiency"
  );

  const techTrends = technologyHealthTrends(buckets, entriesByPeriod, filters);

  const pointCounts = [
    engineeringScoreTrend.data.length,
    engineeringValueDeliveredTrend.data.length,
    recoveryHoursTrend.data.length,
    capacityUtilizationTrend.data.length,
    deliveryEfficiencyTrend.data.length,
    ...techTrends.map((t) => t.data.length),
  ];

  const limitations: string[] = [];
  if (allEntries.length === 0) {
    limitations.push(
      "No archived snapshots yet. Run sync to accumulate Historical Engineering Analytics forward."
    );
  } else if (filtered.length < filters.months) {
    limitations.push(
      `Archive has ${filtered.length} period(s); ${filters.months}-month window is partially populated.`
    );
  }
  limitations.push(
    "Capacity Utilization uses stored contribution/capacity score components (not a separate utilization engine)."
  );

  const technologies = [
    ...new Set(
      allEntries.flatMap((entry) =>
        entry.technologies.map((slice) => slice.technology)
      )
    ),
  ].sort();

  const developers = [
    ...new Set(
      allEntries.flatMap((entry) =>
        entry.developers.map((slice) => slice.developer)
      )
    ),
  ].sort((a, b) => a.localeCompare(b));

  return {
    filters,
    engineeringScoreTrend,
    technologyHealthTrends: techTrends,
    engineeringValueDeliveredTrend,
    recoveryHoursTrend,
    capacityUtilizationTrend,
    deliveryEfficiencyTrend,
    meta: {
      archiveCount: allEntries.length,
      completeness: completenessFrom(pointCounts, filters.months),
      limitations,
      filterOptions: { technologies, developers },
    },
  };
}
