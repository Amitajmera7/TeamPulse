/**
 * Analytics History Read Service — filter parsing + read projection.
 */

import { getLatestCompletedSnapshot } from "@/services/snapshot";

import { buildSnapshotHistoryEntry } from "./build-snapshot-history-entry";
import { buildAnalyticsHistoryReadModel } from "./build-history-read-model";
import type {
  AnalyticsHistoryFilters,
  AnalyticsHistoryMonths,
  AnalyticsHistoryReadModel,
} from "./history-read-model";
import {
  getSnapshotHistoryCount,
  pushSnapshotHistoryEntry,
} from "./snapshot-history-store";

const ALLOWED_MONTHS = new Set<number>([3, 6, 12]);

/**
 * Parses query filters with defaults; ignores unknown keys into extras.
 */
export function parseAnalyticsHistoryFilters(
  params: URLSearchParams | Record<string, string | undefined>
): AnalyticsHistoryFilters {
  const get = (key: string): string | null => {
    if (params instanceof URLSearchParams) {
      const value = params.get(key);
      return value && value.trim() ? value.trim() : null;
    }
    const value = params[key];
    return value && value.trim() ? value.trim() : null;
  };

  const monthsRaw = Number(get("months") ?? "6");
  const months: AnalyticsHistoryMonths = ALLOWED_MONTHS.has(monthsRaw)
    ? (monthsRaw as AnalyticsHistoryMonths)
    : 6;

  const known = new Set(["months", "technology", "developer"]);
  const extras: Record<string, string | null> = {};

  if (params instanceof URLSearchParams) {
    for (const [key, value] of params.entries()) {
      if (!known.has(key)) {
        extras[key] = value?.trim() ? value.trim() : null;
      }
    }
  } else {
    for (const key of Object.keys(params)) {
      if (!known.has(key)) {
        extras[key] = get(key);
      }
    }
  }

  return {
    months,
    technology: get("technology"),
    developer: get("developer"),
    extras: Object.keys(extras).length > 0 ? extras : undefined,
  };
}

/**
 * Ensures the latest completed snapshot is present in the archive
 * (covers process restarts where archive is empty but latest exists).
 */
function seedArchiveFromLatestIfNeeded(): void {
  if (getSnapshotHistoryCount() > 0) {
    return;
  }

  const latest = getLatestCompletedSnapshot();
  if (!latest) {
    return;
  }

  pushSnapshotHistoryEntry(buildSnapshotHistoryEntry(latest));
}

/**
 * Returns Historical Engineering Analytics read model for the given filters.
 */
export function getAnalyticsHistoryReadModel(
  filters?: Partial<AnalyticsHistoryFilters> | URLSearchParams
): AnalyticsHistoryReadModel {
  seedArchiveFromLatestIfNeeded();

  const resolved: AnalyticsHistoryFilters =
    filters instanceof URLSearchParams
      ? parseAnalyticsHistoryFilters(filters)
      : {
          months: (filters?.months ?? 6) as AnalyticsHistoryMonths,
          technology: filters?.technology ?? null,
          developer: filters?.developer ?? null,
          extras: filters?.extras,
        };

  const monthsOk = ALLOWED_MONTHS.has(resolved.months)
    ? resolved.months
    : (6 as AnalyticsHistoryMonths);

  return buildAnalyticsHistoryReadModel({
    ...resolved,
    months: monthsOk,
  });
}
