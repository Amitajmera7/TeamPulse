# Review Checklist

- [ ] Architecture
- [ ] Repository Pattern
- [ ] Strong Typing
- [ ] Build Passes
- [ ] Documentation Updated

# 1 Objective

Implement the **Dashboard Repository** for Sprint 3D Milestone 10C. Make the repository the sole UI entry point for `DashboardData` so React does not know whether data comes from a snapshot, mock, or future database. `dashboard-mock.ts` remains as a legacy development/demo provider and is not read by production UI code.

# 2 Architecture

```
React (Dashboard Page)
    ↓
Dashboard Repository
    ↓
Latest Completed Analytics Snapshot
    ↓
snapshot.dashboardData  (or empty DashboardData)
```

## Why Repository exists

It is the single read boundary between presentation and analytics storage. Sync pipelines publish completed snapshots; the UI only asks the repository for `DashboardData`. That keeps React free of Jira, engines, and provider details.

## Why React should never know the data source

If the page imported mocks, snapshot builders, or aggregators directly, swapping to a database later would require UI changes. The repository hides the provider so only its internals change.

# 3 Files Created

| File | Purpose |
|------|---------|
| `src/services/dashboard-repository/get-dashboard-data.ts` | Read snapshot → DashboardData / empty |
| `src/services/dashboard-repository/repository.ts` | Public repository facade |
| `src/services/dashboard-repository/index.ts` | Module exports |
| `src/services/snapshot/latest-snapshot.ts` | In-memory latest completed snapshot |
| `src/services/dashboard/build-empty-dashboard-data.ts` | Empty-state DashboardData |
| `docs/reviews/milestone-10C-review.md` | This review package |

# 4 Files Modified

| File | Change |
|------|--------|
| `src/app/(dashboard)/dashboard/page.tsx` | Wire to dashboard-repository; expose generatedAt for future Last Sync |
| `src/services/snapshot/index.ts` | Export latest-snapshot accessors |
| `src/services/dashboard/index.ts` | Export `buildEmptyDashboardData`; note repository cutover |
| `docs/Glossary.md` | Dashboard Repository term |
| `docs/Engineering-Metrics-Specification.md` | Dashboard Repository section |
| `docs/reviews/README.md` | Link milestone-10C-review.md |

# 5 Files Deleted

None.

`src/config/dashboard-mock.ts` is retained as a **legacy development/demo provider**.

The Dashboard Repository currently uses Analytics Snapshot.
Mock data remains available for development, testing and demos.

Production React code must not import `dashboard-mock` directly. The repository remains the single entry point for the UI.

# 6 Public Interfaces

```typescript
interface DashboardRepositoryResult {
  readonly dashboardData: DashboardData;
  readonly generatedAt: string | null;
}

function getDashboardData(): DashboardRepositoryResult;
function getDashboardDataFromRepository(): DashboardRepositoryResult;
function isUsableAnalyticsSnapshot(
  snapshot: AnalyticsSnapshot | null | undefined
): snapshot is AnalyticsSnapshot;

function getLatestCompletedSnapshot(): AnalyticsSnapshot | null;
function setLatestCompletedSnapshot(snapshot: AnalyticsSnapshot): boolean;
function clearLatestCompletedSnapshot(): void;

function buildEmptyDashboardData(generatedAt?: string): DashboardData;
```

# 7 Complete Source Code

## `src/services/snapshot/latest-snapshot.ts`

```typescript
/**
 * In-memory holder for the latest completed Analytics Snapshot.
 *
 * Milestone 10C: Dashboard Repository reads from here.
 * Sync / persistence writers will call {@link setLatestCompletedSnapshot} later.
 * This module does not calculate analytics.
 */

import type { AnalyticsSnapshot } from "./types";

let latestCompletedSnapshot: AnalyticsSnapshot | null = null;

/**
 * Returns the latest completed Analytics Snapshot, or null when none exists.
 * Read-only accessor for the Dashboard Repository.
 */
export function getLatestCompletedSnapshot(): AnalyticsSnapshot | null {
  return latestCompletedSnapshot;
}

/**
 * Publishes a completed Analytics Snapshot as the latest.
 *
 * Only snapshots with `syncMetadata.status === "Completed"` are accepted.
 * Returns true when the snapshot was stored.
 */
export function setLatestCompletedSnapshot(
  snapshot: AnalyticsSnapshot
): boolean {
  if (snapshot.syncMetadata.status !== "Completed") {
    return false;
  }

  latestCompletedSnapshot = snapshot;
  return true;
}

/**
 * Clears the latest completed snapshot (tests / reset).
 */
export function clearLatestCompletedSnapshot(): void {
  latestCompletedSnapshot = null;
}
```

## `src/services/dashboard/build-empty-dashboard-data.ts`

```typescript
/**
 * Empty DashboardData builder for missing / unusable Analytics Snapshots.
 *
 * Reuses placeholder trend builders from Dashboard Aggregator V2.
 * Never throws — always returns a valid presentation model.
 */

import { buildPlaceholderTrends } from "./build-dashboard-data";
import type { DashboardData, DashboardKpiData } from "./types";
import { getReportingPeriod } from "./utils";

function emptyKpis(generatedAt: string): DashboardKpiData[] {
  return [
    {
      id: "delivery-health",
      title: "Engineering Health",
      value: "—",
      status: "neutral",
      statusLabel: "No Data",
      trend: "neutral",
      trendLabel: "No snapshot",
      chartColor: "var(--chart-1)",
      sparkline: [],
      generatedAt,
    },
    {
      id: "productivity",
      title: "Engineering Value Delivered",
      value: "0h",
      status: "neutral",
      statusLabel: "No Data",
      trend: "neutral",
      trendLabel: "No snapshot",
      chartColor: "var(--chart-2)",
      sparkline: [],
      generatedAt,
    },
    {
      id: "utilization",
      title: "Quality",
      value: "—",
      status: "neutral",
      statusLabel: "No Data",
      trend: "neutral",
      trendLabel: "No snapshot",
      chartColor: "var(--chart-3)",
      sparkline: [],
      generatedAt,
    },
    {
      id: "risk",
      title: "Recovery",
      value: "0h",
      status: "neutral",
      statusLabel: "No Data",
      trend: "neutral",
      trendLabel: "No snapshot",
      chartColor: "var(--destructive)",
      sparkline: [],
      generatedAt,
    },
  ];
}

/**
 * Builds an empty {@link DashboardData} for UI empty-state rendering.
 *
 * Used when no completed Analytics Snapshot is available.
 */
export function buildEmptyDashboardData(
  generatedAt: string = new Date().toISOString()
): DashboardData {
  const { deliveryTrend, productivityTrend } = buildPlaceholderTrends();

  return {
    engineeringScore: {
      value: 0,
      trend: "neutral",
      status: "No Data",
      sparkline: [],
    },
    scoreComponents: {
      deliveryHealth: 0,
      productivity: 0,
      quality: 0,
      contribution: 0,
      utilization: 0,
      riskHealth: 0,
    },
    kpis: emptyKpis(generatedAt),
    deliveryTrend,
    productivityTrend,
    technologies: [],
    contributors: [],
    insights: [
      {
        id: "no-snapshot",
        title: "Waiting for analytics sync",
        description:
          "No completed Analytics Snapshot is available yet. Run a sync to populate the dashboard.",
        tone: "info",
      },
    ],
    reportingPeriod: getReportingPeriod(),
    updatedAt: generatedAt,
  };
}
```

## `src/services/dashboard-repository/get-dashboard-data.ts`

```typescript
/**
 * Dashboard Repository — read-only access to DashboardData for the UI.
 *
 * Sprint 3D Milestone 10C.
 *
 * Pipeline:
 *   Dashboard Page → Dashboard Repository → Analytics Snapshot → DashboardData
 *
 * Does not recalculate analytics or rebuild snapshots.
 * React must not know whether data comes from mock, snapshot, or a future DB.
 */

import type { AnalyticsSnapshot } from "@/services/snapshot";
import { getLatestCompletedSnapshot } from "@/services/snapshot";

import { buildEmptyDashboardData } from "@/services/dashboard/build-empty-dashboard-data";
import type { DashboardData } from "@/services/dashboard/types";

/**
 * Result returned by the Dashboard Repository.
 *
 * `generatedAt` is exposed for future Last Sync display without forcing
 * a header redesign in this milestone.
 */
export interface DashboardRepositoryResult {
  /** Presentation model consumed by React. */
  readonly dashboardData: DashboardData;
  /**
   * Analytics Snapshot generation timestamp.
   * Null when no completed snapshot exists.
   */
  readonly generatedAt: string | null;
}

/**
 * Returns true when a snapshot is safe to serve to the dashboard.
 *
 * Requires Completed sync status and a present dashboardData projection.
 */
export function isUsableAnalyticsSnapshot(
  snapshot: AnalyticsSnapshot | null | undefined
): snapshot is AnalyticsSnapshot {
  if (snapshot == null) {
    return false;
  }

  if (snapshot.syncMetadata?.status !== "Completed") {
    return false;
  }

  if (snapshot.dashboardData == null) {
    return false;
  }

  return true;
}

/**
 * Reads DashboardData from the latest completed Analytics Snapshot.
 *
 * - Returns `snapshot.dashboardData` when a usable snapshot exists.
 * - Returns empty DashboardData when missing / invalid — never throws.
 * - Does not recalculate analytics or rebuild the snapshot.
 */
export function getDashboardDataFromRepository(): DashboardRepositoryResult {
  try {
    const snapshot = getLatestCompletedSnapshot();

    if (!isUsableAnalyticsSnapshot(snapshot)) {
      return {
        dashboardData: buildEmptyDashboardData(),
        generatedAt: null,
      };
    }

    return {
      dashboardData: snapshot.dashboardData,
      generatedAt: snapshot.generatedAt,
    };
  } catch {
    return {
      dashboardData: buildEmptyDashboardData(),
      generatedAt: null,
    };
  }
}
```

## `src/services/dashboard-repository/repository.ts`

```typescript
/**
 * Dashboard Repository facade.
 *
 * Abstracts the data source for DashboardData. Current provider: Analytics Snapshot.
 * Future providers (database, cache) can replace the internals without changing React.
 */

import {
  getDashboardDataFromRepository,
  isUsableAnalyticsSnapshot,
  type DashboardRepositoryResult,
} from "./get-dashboard-data";

/**
 * Dashboard Repository — sole UI entry for DashboardData.
 *
 * @returns Presentation data plus optional snapshot `generatedAt` for Last Sync.
 */
export function getDashboardData(): DashboardRepositoryResult {
  return getDashboardDataFromRepository();
}

export type { DashboardRepositoryResult };
export { isUsableAnalyticsSnapshot };
```

## `src/services/dashboard-repository/index.ts`

```typescript
/**
 * Dashboard Repository — public module entry.
 *
 * Sprint 3D Milestone 10C makes the repository the sole UI data entry point.
 *
 * The Dashboard Repository currently uses Analytics Snapshot.
 * Mock data remains available for development, testing and demos.
 *
 * React consumes DashboardData only and must not import dashboard-mock.
 */

export {
  getDashboardDataFromRepository,
  isUsableAnalyticsSnapshot,
} from "./get-dashboard-data";
export { getDashboardData } from "./repository";

export type { DashboardRepositoryResult } from "./get-dashboard-data";
```

## `src/services/snapshot/index.ts`

```typescript
/**
 * Analytics Snapshot Engine — public module entry.
 *
 * Sprint 3D Milestone 10A defines the immutable snapshot model.
 * Milestone 10C adds an in-memory latest-completed snapshot accessor
 * for the Dashboard Repository.
 */

export {
  buildAnalyticsSnapshot,
  buildAnalyticsSnapshotWithSync,
} from "./build-analytics-snapshot";
export {
  buildSyncMetadata,
  calculateSyncDurationMs,
} from "./build-sync-metadata";
export {
  clearLatestCompletedSnapshot,
  getLatestCompletedSnapshot,
  setLatestCompletedSnapshot,
} from "./latest-snapshot";
export { ANALYTICS_SNAPSHOT_VERSION } from "./types";

export type {
  AnalyticsSnapshot,
  AnalyticsSnapshotVersion,
  BuildAnalyticsSnapshotInput,
  BuildSyncMetadataInput,
  ReportingPeriod,
  SyncMetadata,
  SyncStatus,
} from "./types";
```

## `src/services/dashboard/index.ts`

```typescript
/**
 * Dashboard services — public module entry.
 *
 * Milestone 10B adds Dashboard Aggregator V2 (snapshot → DashboardData).
 * Milestone 10C: UI reads DashboardData via `@/services/dashboard-repository`.
 * Legacy `dashboard-aggregator.ts` remains for API / sync pipelines until retired.
 */

export {
  buildContributorsFromProfiles,
  compareDeveloperProfilesForContributors,
  mapDeveloperProfileToContributor,
} from "./build-contributors";
export {
  buildDashboardDataFromSnapshot,
  buildPlaceholderTrends,
  mapTechnologyProfileToCard,
  mapTechnologyStatusToMetricStatus,
} from "./build-dashboard-data";
export { buildEmptyDashboardData } from "./build-empty-dashboard-data";
export {
  buildExecutiveBrief,
  allTechnologiesHealthy,
  selectAttentionTechnology,
  selectBestPerformingTechnology,
  selectHighestValueTechnology,
  selectRecoveryFocusTechnology,
} from "./build-executive-brief";
export {
  buildKpisFromSnapshot,
  sumEngineeringValueDeliveredHours,
  sumRecoveryHours,
  weightedAverageEngineeringScore,
  weightedAverageQuality,
} from "./build-kpis";

export type {
  ContributorRow,
  DashboardData,
  DashboardKpiData,
  EngineeringInsight,
  EngineeringScoreData,
  ReportingPeriod,
  ScoreComponents,
  TechnologyCardData,
  TrendChartData,
} from "./types";
```

## `src/app/(dashboard)/dashboard/page.tsx`

```typescript
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardTopBar } from "@/components/dashboard/dashboard-top-bar";
import { ExecutiveDashboard } from "@/components/dashboard/executive-dashboard";
import { PageContainer } from "@/components/common/layout/page-container";
import { getDashboardData } from "@/services/dashboard-repository";

export default function DashboardPage() {
  // Repository is the only DashboardData source for the UI.
  // `generatedAt` is exposed for future Last Sync display (no header redesign yet).
  const { dashboardData: data, generatedAt: _generatedAt } = getDashboardData();
  void _generatedAt;

  return (
    <>
      <DashboardTopBar />
      <DashboardHero engineeringScore={data.engineeringScore} />
      <PageContainer>
        <ExecutiveDashboard data={data} />
      </PageContainer>
    </>
  );
}
```

# 8 Validation

## Dashboard with Snapshot

```typescript
setLatestCompletedSnapshot(completedSnapshot);
const result = getDashboardData();
// result.dashboardData === completedSnapshot.dashboardData
// result.generatedAt === completedSnapshot.generatedAt
```

## Dashboard without Snapshot

```typescript
clearLatestCompletedSnapshot();
const result = getDashboardData();
// result.dashboardData.engineeringScore.status === "No Data"
// result.generatedAt === null
```

## Empty state

`buildEmptyDashboardData()` yields zeroed KPIs, empty technologies/contributors, placeholder trends, and a “Waiting for analytics sync” insight.

## Repository flow

```
Page → getDashboardData()
     → getLatestCompletedSnapshot()
     → usable? snapshot.dashboardData : buildEmptyDashboardData()
```

# 9 Edge Cases

## Missing Snapshot

`getLatestCompletedSnapshot()` returns null → empty DashboardData; `generatedAt` null.

## Empty Snapshot

Completed snapshot with empty profiles / empty dashboard projection is still returned as-is (read-only; no rebuild).

## Invalid Snapshot

Non-Completed status or missing `dashboardData` → treated as unusable → empty DashboardData. Runtime errors caught → empty DashboardData (never throws).

## Future provider compatibility

`repository.ts` facade can swap `getDashboardDataFromRepository` internals for DB/cache without changing the page import.

# 10 Architecture Diagram

```
Jira
    ↓
Analytics
    ↓
Snapshot
    ↓
Repository
    ↓
React
```

# 11 Build Output

```
> teampulse@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 5.1s
  Running TypeScript ...
  Finished TypeScript in 4.9s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/15) ...
The width(-1) and height(-1) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(-1) and height(-1) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
  Generating static pages using 7 workers (3/15) 
  Generating static pages using 7 workers (7/15) 
  Generating static pages using 7 workers (11/15) 
✓ Generating static pages using 7 workers (15/15) in 446ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /ai
├ ○ /analytics
├ ƒ /api/contribution
├ ƒ /api/leaderboard
├ ƒ /api/metrics
├ ƒ /api/sync
├ ○ /dashboard
├ ○ /developers
├ ○ /leaderboard
├ ○ /settings
└ ○ /teams


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

Exit code: 0

# 12 Self Review

**Rating: 8.5 / 10**

## Known limitations

- Latest snapshot is in-memory only (lost on process restart) until persistence exists.
- Dashboard shows empty state until a sync publishes a completed snapshot via `setLatestCompletedSnapshot`.
- `generatedAt` is wired through the repository but not displayed in the header yet.
- Legacy `dashboard-aggregator.ts` still exists for APIs; UI no longer uses it.
- `dashboard-mock.ts` remains for development/testing/demos only — not wired to production UI.

## Future improvements

- Persist latest completed snapshot; hydrate store on boot.
- Display Last Sync from `generatedAt` in the hero/top bar.
- Sync job: engines → `buildDashboardDataFromSnapshot` → snapshot → `setLatestCompletedSnapshot`.

## Technical debt

- Dual paths: repository (UI) vs legacy aggregator (APIs).
- `void _generatedAt` on the page is temporary until Last Sync UI lands.
