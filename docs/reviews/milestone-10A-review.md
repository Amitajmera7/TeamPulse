# Review Checklist

- [ ] Architecture
- [ ] Business Rules
- [ ] Strong Typing
- [ ] Pure Functions
- [ ] Build Passes
- [ ] Documentation Updated

# 1 Objective

Implement the **Analytics Snapshot Engine** for Sprint 3D Milestone 10A. This milestone defines the immutable snapshot model that sits between analytics engines and the dashboard. It does **not** modify React components, dashboard UI, or dashboard-mock, and does **not** implement caching, persistence, or scheduled jobs.

# 2 Architecture

```
snapshot/
├── types.ts                      # AnalyticsSnapshot, SyncMetadata, SyncStatus
├── build-sync-metadata.ts        # Sync metadata assembler
├── build-analytics-snapshot.ts   # Snapshot assembler
└── index.ts                      # Public module exports
```

## Pipeline

```
Analytics Engines
    ↓
Analytics Snapshot
    ↓
Dashboard
```

## Why Snapshot exists

The snapshot is the single completed unit of engineering intelligence. It freezes developer profiles, technology profiles, dashboard projection, reporting period, and sync metadata into one immutable object so the UI never reads mid-calculation state.

## Why immutability is important

Every sync creates a brand-new snapshot. Existing snapshots are never mutated. That prevents race conditions where a Running sync partially overwrites values the dashboard is currently rendering.

## Why Dashboard should never calculate analytics

Analytics engines own formulas and aggregation. The dashboard is a consumer. Calculating in the UI would duplicate business logic, risk inconsistent scores, and couple React to Jira-shaped data. The snapshot boundary keeps calculation upstream and rendering downstream.

# 3 Business Rules

| Rule | Implementation |
|------|----------------|
| AnalyticsSnapshot represents one completed calculation | `AnalyticsSnapshot` interface |
| Contains version, generatedAt, reportingPeriod, developerProfiles, technologyProfiles, dashboardData, syncMetadata | Typed fields on `AnalyticsSnapshot` (`version` = `"1.0"`) |
| SyncMetadata with timing, counts, status | `SyncMetadata` + `buildSyncMetadata` |
| Status Idle / Running / Completed / Failed | `SyncStatus` |
| Immutable — never mutate existing snapshots | `Object.freeze` + copied arrays |
| Dashboard consumes latest completed snapshot | Documented contract; status gate for consumers |
| Model only — no cache / persistence / jobs | Builders only; no store |

# 4 Files Created

| File | Purpose |
|------|---------|
| `src/services/snapshot/types.ts` | Snapshot and sync metadata contracts |
| `src/services/snapshot/build-sync-metadata.ts` | Sync metadata builder |
| `src/services/snapshot/build-analytics-snapshot.ts` | Snapshot builder |
| `src/services/snapshot/index.ts` | Public module exports |
| `docs/reviews/milestone-10A-review.md` | This review package |

# 5 Files Modified

| File | Change |
|------|--------|
| `docs/Glossary.md` | Added Analytics Snapshot |
| `docs/Engineering-Metrics-Specification.md` | Added Analytics Snapshot section |
| `docs/reviews/README.md` | Linked milestone-10A-review.md |

# 6 Files Deleted

None.

# 7 Public Interfaces

```typescript
const ANALYTICS_SNAPSHOT_VERSION = "1.0" as const;
type AnalyticsSnapshotVersion = typeof ANALYTICS_SNAPSHOT_VERSION;
type SyncStatus = "Idle" | "Running" | "Completed" | "Failed";

interface SyncMetadata {
  readonly syncStartedAt: string;
  readonly syncCompletedAt: string;
  readonly syncDurationMs: number;
  readonly totalIssuesProcessed: number;
  readonly totalWorklogsProcessed: number;
  readonly status: SyncStatus;
}

interface AnalyticsSnapshot {
  readonly version: "1.0";
  readonly generatedAt: string;
  readonly reportingPeriod: ReportingPeriod;
  readonly developerProfiles: readonly DeveloperProfile[];
  readonly technologyProfiles: readonly TechnologyProfile[];
  readonly dashboardData: DashboardData;
  readonly syncMetadata: SyncMetadata;
}

interface BuildSyncMetadataInput {
  syncStartedAt: string;
  syncCompletedAt: string;
  totalIssuesProcessed: number;
  totalWorklogsProcessed: number;
  status: SyncStatus;
}

interface BuildAnalyticsSnapshotInput {
  generatedAt?: string;
  reportingPeriod: ReportingPeriod;
  developerProfiles: readonly DeveloperProfile[];
  technologyProfiles: readonly TechnologyProfile[];
  dashboardData: DashboardData;
  syncMetadata: SyncMetadata;
}

function calculateSyncDurationMs(
  syncStartedAt: string,
  syncCompletedAt: string
): number;

function buildSyncMetadata(input: BuildSyncMetadataInput): SyncMetadata;

function buildAnalyticsSnapshot(
  input: BuildAnalyticsSnapshotInput
): AnalyticsSnapshot;

function buildAnalyticsSnapshotWithSync(
  input: Omit<BuildAnalyticsSnapshotInput, "syncMetadata"> & {
    sync: BuildSyncMetadataInput;
  }
): AnalyticsSnapshot;
```

# 8 Complete Source Code

## `src/services/snapshot/types.ts`

```typescript
/**
 * Analytics Snapshot Engine — type definitions.
 *
 * Sprint 3D Milestone 10A defines the immutable snapshot model that sits
 * between analytics engines and the dashboard.
 *
 * No caching, persistence, or scheduled jobs in this milestone.
 */

import type { DashboardData, ReportingPeriod } from "@/services/dashboard/types";
import type { DeveloperProfile } from "@/services/developer-profile";
import type { TechnologyProfile } from "@/services/technology-profile";

export type { ReportingPeriod };

/** Initial Analytics Snapshot schema version. */
export const ANALYTICS_SNAPSHOT_VERSION = "1.0" as const;

export type AnalyticsSnapshotVersion = typeof ANALYTICS_SNAPSHOT_VERSION;

/**
 * Sync lifecycle status for an analytics calculation run.
 *
 * - Idle — sync has not started
 * - Running — sync is in progress (snapshot not yet consumable by dashboard)
 * - Completed — sync finished successfully (dashboard may consume)
 * - Failed — sync failed (dashboard must keep the previous completed snapshot)
 */
export type SyncStatus = "Idle" | "Running" | "Completed" | "Failed";

/**
 * Metadata describing a single analytics sync run.
 *
 * Produced alongside each {@link AnalyticsSnapshot}. Never mutated in place.
 */
export interface SyncMetadata {
  /** ISO-8601 timestamp when the sync started. */
  readonly syncStartedAt: string;
  /** ISO-8601 timestamp when the sync completed (or failed). */
  readonly syncCompletedAt: string;
  /** Elapsed sync duration in milliseconds. */
  readonly syncDurationMs: number;
  /** Number of Jira issues processed during the sync. */
  readonly totalIssuesProcessed: number;
  /** Number of worklog entries processed during the sync. */
  readonly totalWorklogsProcessed: number;
  /** Lifecycle status of this sync run. */
  readonly status: SyncStatus;
}

/**
 * Immutable analytics snapshot — one completed analytics calculation.
 *
 * Pipeline:
 *   Jira Data → Analytics Engines → Analytics Snapshot → Dashboard
 *
 * The dashboard must consume the latest **Completed** snapshot only.
 * Every sync creates a brand-new snapshot; existing snapshots are never mutated.
 */
export interface AnalyticsSnapshot {
  /** Snapshot schema version. Initial value: "1.0". */
  readonly version: AnalyticsSnapshotVersion;
  /** ISO-8601 timestamp when this snapshot object was assembled. */
  readonly generatedAt: string;
  /** Reporting window covered by this snapshot. */
  readonly reportingPeriod: ReportingPeriod;
  /** Developer profiles produced by the Developer Profile Engine. */
  readonly developerProfiles: readonly DeveloperProfile[];
  /** Technology profiles produced by the Technology Aggregation Engine. */
  readonly technologyProfiles: readonly TechnologyProfile[];
  /**
   * Dashboard projection for UI consumption.
   * Assembled by callers; this milestone stores it without recalculating.
   */
  readonly dashboardData: DashboardData;
  /** Sync run metadata for this snapshot. */
  readonly syncMetadata: SyncMetadata;
}

/** Inputs required to assemble {@link SyncMetadata}. */
export interface BuildSyncMetadataInput {
  syncStartedAt: string;
  syncCompletedAt: string;
  totalIssuesProcessed: number;
  totalWorklogsProcessed: number;
  status: SyncStatus;
}

/** Inputs required to assemble an {@link AnalyticsSnapshot}. */
export interface BuildAnalyticsSnapshotInput {
  /** Optional override; defaults to syncMetadata.syncCompletedAt. */
  generatedAt?: string;
  reportingPeriod: ReportingPeriod;
  developerProfiles: readonly DeveloperProfile[];
  technologyProfiles: readonly TechnologyProfile[];
  dashboardData: DashboardData;
  syncMetadata: SyncMetadata;
}
```

## `src/services/snapshot/build-sync-metadata.ts`

```typescript
import type { BuildSyncMetadataInput, SyncMetadata } from "./types";

/**
 * Computes sync duration in milliseconds from start/end ISO timestamps.
 *
 * Returns 0 when either timestamp is invalid or completedAt precedes startedAt.
 */
export function calculateSyncDurationMs(
  syncStartedAt: string,
  syncCompletedAt: string
): number {
  const started = Date.parse(syncStartedAt);
  const completed = Date.parse(syncCompletedAt);

  if (Number.isNaN(started) || Number.isNaN(completed)) {
    return 0;
  }

  return Math.max(0, completed - started);
}

/**
 * Assembles immutable {@link SyncMetadata} for one analytics sync run.
 *
 * Pure — does not perform I/O or mutate inputs.
 * Duration is derived from start/end timestamps (never hardcoded).
 */
export function buildSyncMetadata(
  input: BuildSyncMetadataInput
): SyncMetadata {
  const metadata: SyncMetadata = {
    syncStartedAt: input.syncStartedAt,
    syncCompletedAt: input.syncCompletedAt,
    syncDurationMs: calculateSyncDurationMs(
      input.syncStartedAt,
      input.syncCompletedAt
    ),
    totalIssuesProcessed: input.totalIssuesProcessed,
    totalWorklogsProcessed: input.totalWorklogsProcessed,
    status: input.status,
  };

  return Object.freeze(metadata);
}
```

## `src/services/snapshot/build-analytics-snapshot.ts`

```typescript
import { buildSyncMetadata } from "./build-sync-metadata";
import {
  ANALYTICS_SNAPSHOT_VERSION,
  type AnalyticsSnapshot,
  type BuildAnalyticsSnapshotInput,
  type BuildSyncMetadataInput,
  type SyncMetadata,
} from "./types";

/**
 * Assembles an immutable {@link AnalyticsSnapshot}.
 *
 * Every call returns a brand-new frozen snapshot. Inputs are copied into
 * readonly arrays so later mutations of the caller's arrays cannot alter
 * a published snapshot.
 *
 * This milestone creates the snapshot model only:
 * - No caching
 * - No persistence
 * - No scheduled jobs
 * - No analytics recalculation (engines run upstream)
 *
 * Dashboard consumers should read only snapshots with
 * `syncMetadata.status === "Completed"`.
 */
export function buildAnalyticsSnapshot(
  input: BuildAnalyticsSnapshotInput
): AnalyticsSnapshot {
  const generatedAt =
    input.generatedAt ?? input.syncMetadata.syncCompletedAt;

  const snapshot: AnalyticsSnapshot = {
    version: ANALYTICS_SNAPSHOT_VERSION,
    generatedAt,
    reportingPeriod: Object.freeze({ ...input.reportingPeriod }),
    developerProfiles: Object.freeze([...input.developerProfiles]),
    technologyProfiles: Object.freeze([...input.technologyProfiles]),
    dashboardData: Object.freeze({ ...input.dashboardData }),
    syncMetadata: input.syncMetadata,
  };

  return Object.freeze(snapshot);
}

/**
 * Convenience builder: assemble sync metadata then the snapshot in one step.
 *
 * Still pure and immutable — returns a new frozen snapshot every call.
 */
export function buildAnalyticsSnapshotWithSync(
  input: Omit<BuildAnalyticsSnapshotInput, "syncMetadata"> & {
    sync: BuildSyncMetadataInput;
  }
): AnalyticsSnapshot {
  const syncMetadata: SyncMetadata = buildSyncMetadata(input.sync);

  return buildAnalyticsSnapshot({
    generatedAt: input.generatedAt,
    reportingPeriod: input.reportingPeriod,
    developerProfiles: input.developerProfiles,
    technologyProfiles: input.technologyProfiles,
    dashboardData: input.dashboardData,
    syncMetadata,
  });
}
```

## `src/services/snapshot/index.ts`

```typescript
/**
 * Analytics Snapshot Engine — public module entry.
 *
 * Sprint 3D Milestone 10A defines the immutable snapshot model between
 * analytics engines and the dashboard.
 *
 * Does not modify React components, dashboard UI, or dashboard-mock.
 * Does not implement caching, persistence, or scheduled jobs.
 */

export {
  buildAnalyticsSnapshot,
  buildAnalyticsSnapshotWithSync,
} from "./build-analytics-snapshot";
export {
  buildSyncMetadata,
  calculateSyncDurationMs,
} from "./build-sync-metadata";
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

# 9 Mathematical Validation

Not applicable.

## Object examples

### Completed snapshot (happy path)

```typescript
const snapshot = buildAnalyticsSnapshotWithSync({
  reportingPeriod: {
    month: "July 2026",
    from: "2026-07-01T00:00:00.000Z",
    to: "2026-07-31T23:59:59.999Z",
  },
  developerProfiles: [/* DeveloperProfile[] */],
  technologyProfiles: [/* TechnologyProfile[] */],
  dashboardData: { /* DashboardData */ },
  sync: {
    syncStartedAt: "2026-07-11T08:00:00.000Z",
    syncCompletedAt: "2026-07-11T08:00:12.500Z",
    totalIssuesProcessed: 420,
    totalWorklogsProcessed: 1800,
    status: "Completed",
  },
});

// snapshot.version === "1.0"
// snapshot.syncMetadata.syncDurationMs === 12500
// snapshot.syncMetadata.status === "Completed"
// Object.isFrozen(snapshot) === true
```

### Running sync metadata

```typescript
buildSyncMetadata({
  syncStartedAt: "2026-07-11T08:00:00.000Z",
  syncCompletedAt: "2026-07-11T08:00:00.000Z",
  totalIssuesProcessed: 0,
  totalWorklogsProcessed: 0,
  status: "Running",
});
// Dashboard must ignore — not Completed
```

### Failed sync metadata

```typescript
buildSyncMetadata({
  syncStartedAt: "2026-07-11T08:00:00.000Z",
  syncCompletedAt: "2026-07-11T08:00:03.000Z",
  totalIssuesProcessed: 12,
  totalWorklogsProcessed: 40,
  status: "Failed",
});
// Dashboard keeps previous Completed snapshot
```

### Empty profiles / empty dashboard projection

```typescript
buildAnalyticsSnapshot({
  reportingPeriod: { month: "July 2026", from: "...", to: "..." },
  developerProfiles: [],
  technologyProfiles: [],
  dashboardData: emptyDashboardData,
  syncMetadata: completedMetadata,
});
// Valid snapshot — empty arrays allowed; still immutable
```

# 10 Edge Cases

## Running Sync

`status: "Running"` may be recorded on an in-progress metadata object. Dashboard consumers must not replace the active completed snapshot with a Running snapshot.

## Failed Sync

`status: "Failed"` records timing/counts for diagnostics. Dashboard continues serving the last Completed snapshot.

## No Developers

`developerProfiles: []` is valid. Snapshot still freezes and remains consumable.

## No Technologies

`technologyProfiles: []` is valid (callers may also pass the four empty technology profiles from Milestone 9).

## Empty Dashboard

`dashboardData` may be a structurally empty/zeroed `DashboardData` projection. This milestone stores it without validating or recalculating KPIs.

# 11 Architecture Diagram

```
Jira
    ↓
Analytics
    ↓
Snapshot
    ↓
Dashboard
```

# 12 Build Output

```
> teampulse@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 4.4s
  Running TypeScript ...
  Finished TypeScript in 4.6s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/15) ...
  Generating static pages using 7 workers (3/15) 
  Generating static pages using 7 workers (7/15) 
The width(-1) and height(-1) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
The width(-1) and height(-1) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
  Generating static pages using 7 workers (11/15) 
✓ Generating static pages using 7 workers (15/15) in 19.5s
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

# 13 Self Review

**Rating: 8.5 / 10**

## Known limitations

- No snapshot store / latest-completed selector yet (Milestone 10B+).
- `Object.freeze` is shallow for nested profile and dashboard internals; array shells and top-level snapshot fields are frozen.
- `dashboardData` is accepted as a caller-provided projection — not built from profiles in this milestone.

## Future improvements

- In-memory / persisted snapshot cache with “latest Completed” accessor.
- Deep-freeze helper if stronger runtime immutability is required.
- Wire sync pipeline to produce snapshots end-to-end and replace dashboard-mock.

## Technical debt

- Type-only dependency on `@/services/dashboard/types` for `DashboardData` / `ReportingPeriod` (same pattern as prior milestones).
- Convenience `buildAnalyticsSnapshotWithSync` overlaps slightly with composing the two builders manually — kept for ergonomics.
