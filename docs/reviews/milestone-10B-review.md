# Review Checklist

- [ ] Architecture
- [ ] Business Rules
- [ ] Strong Typing
- [ ] Pure Functions
- [ ] Build Passes
- [ ] Documentation Updated

# 1 Objective

Implement **Dashboard Aggregator V2** for Sprint 3D Milestone 10B. Build `DashboardData` from an Analytics Snapshot so React never calculates analytics. Do **not** modify React components, replace `dashboard-mock.ts`, or modify analytics engines.

# 2 Architecture

```
dashboard/
├── build-kpis.ts              # Engineering Health / Value / Quality / Recovery
├── build-contributors.ts      # Top 10 from Developer Profiles
├── build-executive-brief.ts   # Exactly four rule-based insights
├── build-dashboard-data.ts    # Orchestrator + technology mapping
├── index.ts                   # Public V2 exports
├── types.ts                   # DashboardData (+ optional KPI generatedAt)
└── … legacy V1 aggregators unchanged
```

## Pipeline

```
Analytics Snapshot
    ↓
Dashboard Aggregator
    ↓
DashboardData
    ↓
React Dashboard
```

## Why DashboardData remains the presentation model

React already consumes `DashboardData` (`ExecutiveDashboard`, metric cards, technology cards, contributors, insights). V2 fills that same contract from snapshot profiles so UI stays stable while analytics stay upstream. KPI card `id`s remain the existing four values so icon maps work without React changes; titles/values reflect Milestone 10B semantics.

# 3 Business Rules

| Rule | Implementation |
|------|----------------|
| Input AnalyticsSnapshot → Output DashboardData | `buildDashboardDataFromSnapshot` |
| Engineering Health = weighted Engineering Score (weight = delivered hours) | `weightedAverageEngineeringScore` |
| Engineering Value Delivered = sum delivered hours | `sumEngineeringValueDeliveredHours` |
| Quality = weighted avg (weight = delivered hours) | `weightedAverageQuality` via shared `weightedAverage` |
| Recovery = total recovery hours | `sumRecoveryHours` |
| Each KPI exposes generatedAt | `DashboardKpiData.generatedAt` |
| Contributors: score DESC, value DESC, name ASC, top 10 | `buildContributorsFromProfiles` |
| Technologies: map only, no recalculation | `mapTechnologyProfileToCard` |
| Executive Brief: exactly 4 rule-based insights | `buildExecutiveBrief` |
| Trends unchanged / out of scope | `buildPlaceholderTrends` |
| No React / mock / engine changes | New files + types/docs only |

# 4 Files Created

| File | Purpose |
|------|---------|
| `src/services/dashboard/build-kpis.ts` | KPI calculations from developer profiles |
| `src/services/dashboard/build-contributors.ts` | Top contributor ranking |
| `src/services/dashboard/build-executive-brief.ts` | Four Executive Brief insights |
| `src/services/dashboard/build-dashboard-data.ts` | Snapshot → DashboardData orchestrator |
| `src/services/dashboard/index.ts` | Public V2 module exports |
| `docs/reviews/milestone-10B-review.md` | This review package |

# 5 Files Modified

| File | Change |
|------|--------|
| `src/services/dashboard/types.ts` | Optional `generatedAt` on `DashboardKpiData` |
| `docs/Glossary.md` | Dashboard Aggregator V2 term |
| `docs/Engineering-Metrics-Specification.md` | Dashboard Aggregator V2 section |
| `docs/reviews/README.md` | Link milestone-10B-review.md |

# 6 Files Deleted

None.

# 7 Public Interfaces

```typescript
function buildDashboardDataFromSnapshot(snapshot: AnalyticsSnapshot): DashboardData;
function buildKpisFromSnapshot(input: {
  developerProfiles: readonly DeveloperProfile[];
  generatedAt: string;
}): DashboardKpiData[];
function weightedAverageEngineeringScore(profiles: readonly DeveloperProfile[]): number | null;
function sumEngineeringValueDeliveredHours(profiles: readonly DeveloperProfile[]): number;
function weightedAverageQuality(profiles: readonly DeveloperProfile[]): number | null;
function sumRecoveryHours(profiles: readonly DeveloperProfile[]): number;

function buildContributorsFromProfiles(
  profiles: readonly DeveloperProfile[],
  limit?: number
): ContributorRow[];
function compareDeveloperProfilesForContributors(a: DeveloperProfile, b: DeveloperProfile): number;
function mapDeveloperProfileToContributor(profile: DeveloperProfile): Omit<ContributorRow, "storiesMax" | "hoursMax">;

function buildExecutiveBrief(technologyProfiles: readonly TechnologyProfile[]): EngineeringInsight[];
function allTechnologiesHealthy(profiles: readonly TechnologyProfile[]): boolean;
function selectBestPerformingTechnology(profiles: readonly TechnologyProfile[]): TechnologyProfile | null;
function selectHighestValueTechnology(profiles: readonly TechnologyProfile[]): TechnologyProfile | null;
function selectAttentionTechnology(profiles: readonly TechnologyProfile[]): TechnologyProfile | null;
function selectRecoveryFocusTechnology(profiles: readonly TechnologyProfile[]): TechnologyProfile | null;

function mapTechnologyProfileToCard(profile: TechnologyProfile): TechnologyCardData;
function mapTechnologyStatusToMetricStatus(status: TechnologyStatus): MetricStatus;
function buildPlaceholderTrends(): { deliveryTrend: TrendChartData; productivityTrend: TrendChartData };

// types.ts addition
interface DashboardKpiData {
  // …existing fields
  generatedAt?: string;
}
```

# 8 Complete Source Code

## `src/services/dashboard/types.ts` (KPI section)

```typescript
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
  /**
   * Analytics Snapshot generation timestamp (Milestone 10B).
   * Present on KPIs built from AnalyticsSnapshot.
   */
  generatedAt?: string;
}
```

## `src/services/dashboard/build-kpis.ts`

```typescript
/**
 * Dashboard Aggregator V2 — KPI builders from Analytics Snapshot.
 *
 * Sprint 3D Milestone 10B. Pure mapping — no analytics engine recalculation.
 */

import type { DeveloperProfile } from "@/services/developer-profile";
import { weightedAverage } from "@/services/technology-profile";
import type { MetricStatus } from "@/types/dashboard";

import type { DashboardKpiData } from "./types";
import { statusFromPercent } from "./utils";

/**
 * Weighted average of Engineering Scores.
 *
 * Weight = Engineering Value Delivered (Delivered Engineering Hours).
 * Missing Engineering Scores are excluded (never treated as zero).
 * Entries with weight ≤ 0 do not contribute.
 */
export function weightedAverageEngineeringScore(
  profiles: readonly DeveloperProfile[]
): number | null {
  return weightedAverage(
    profiles
      .filter((profile) => profile.engineeringScore !== null)
      .map((profile) => ({
        value: profile.engineeringScore as number,
        weight: profile.evaluation.contribution.deliveredEngineeringHours,
      }))
  );
}

/**
 * Sum of Delivered Engineering Hours across developer profiles.
 */
export function sumEngineeringValueDeliveredHours(
  profiles: readonly DeveloperProfile[]
): number {
  return profiles.reduce(
    (total, profile) =>
      total + profile.evaluation.contribution.deliveredEngineeringHours,
    0
  );
}

/**
 * Weighted average Delivery Quality.
 * Weight = Engineering Value Delivered (Delivered Engineering Hours).
 * Unresolved quality results are ignored.
 */
export function weightedAverageQuality(
  profiles: readonly DeveloperProfile[]
): number | null {
  return weightedAverage(
    profiles
      .filter((profile) => profile.evaluation.quality.resolved)
      .map((profile) => ({
        value: profile.evaluation.quality.qualityScore,
        weight: profile.evaluation.contribution.deliveredEngineeringHours,
      }))
  );
}

/**
 * Sum of Recovery Hours across developer profiles.
 */
export function sumRecoveryHours(
  profiles: readonly DeveloperProfile[]
): number {
  return profiles.reduce(
    (total, profile) => total + profile.evaluation.recovery.totalRecoveryHours,
    0
  );
}

function formatScore(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatHours(value: number): string {
  if (Number.isInteger(value)) {
    return `${value}h`;
  }

  return `${value.toFixed(1)}h`;
}

function recoveryStatus(hours: number): {
  status: MetricStatus;
  statusLabel: string;
} {
  if (hours <= 0) {
    return { status: "healthy", statusLabel: "None" };
  }

  if (hours < 20) {
    return { status: "on-track", statusLabel: "Low" };
  }

  if (hours < 40) {
    return { status: "neutral", statusLabel: "Moderate" };
  }

  return { status: "attention", statusLabel: "Elevated" };
}

/**
 * Builds the four dashboard KPI cards from developer profiles.
 *
 * KPI semantics (Milestone 10B):
 * 1. Engineering Health — average Engineering Score
 * 2. Engineering Value Delivered — sum of delivered hours
 * 3. Quality — weighted average quality (weight = delivered hours)
 * 4. Recovery — total recovery hours
 *
 * Existing KPI `id` values are preserved so React icon maps remain valid
 * without modifying dashboard UI components.
 *
 * Each KPI includes `generatedAt` from the Analytics Snapshot.
 */
export function buildKpisFromSnapshot(input: {
  developerProfiles: readonly DeveloperProfile[];
  generatedAt: string;
}): DashboardKpiData[] {
  const { developerProfiles, generatedAt } = input;

  const engineeringHealth = weightedAverageEngineeringScore(developerProfiles);
  const engineeringValue = sumEngineeringValueDeliveredHours(developerProfiles);
  const quality = weightedAverageQuality(developerProfiles);
  const recoveryHours = sumRecoveryHours(developerProfiles);

  const healthStatus =
    engineeringHealth === null
      ? { status: "neutral" as const, label: "No Data" }
      : statusFromPercent(engineeringHealth);

  const qualityStatus =
    quality === null
      ? { status: "neutral" as const, label: "No Data" }
      : statusFromPercent(quality);

  const recovery = recoveryStatus(recoveryHours);

  return [
    {
      id: "delivery-health",
      title: "Engineering Health",
      value:
        engineeringHealth === null
          ? "—"
          : `${formatScore(engineeringHealth)}`,
      status: healthStatus.status,
      statusLabel: healthStatus.label,
      trend: "neutral",
      trendLabel: "Snapshot",
      chartColor: "var(--chart-1)",
      sparkline: engineeringHealth === null ? [] : [engineeringHealth],
      generatedAt,
    },
    {
      id: "productivity",
      title: "Engineering Value Delivered",
      value: formatHours(engineeringValue),
      status: engineeringValue > 0 ? "on-track" : "neutral",
      statusLabel: engineeringValue > 0 ? "Delivered" : "No Data",
      trend: "neutral",
      trendLabel: "Snapshot",
      chartColor: "var(--chart-2)",
      sparkline: [],
      generatedAt,
    },
    {
      id: "utilization",
      title: "Quality",
      value: quality === null ? "—" : formatScore(quality),
      status: qualityStatus.status,
      statusLabel: qualityStatus.label,
      trend: "neutral",
      trendLabel: "Snapshot",
      chartColor: "var(--chart-3)",
      sparkline: quality === null ? [] : [quality],
      generatedAt,
    },
    {
      id: "risk",
      title: "Recovery",
      value: formatHours(recoveryHours),
      status: recovery.status,
      statusLabel: recovery.statusLabel,
      trend: "neutral",
      trendLabel: "Snapshot",
      chartColor: "var(--destructive)",
      sparkline: [],
      valueClassName: recoveryHours > 0 ? "text-destructive" : undefined,
      generatedAt,
    },
  ];
}
```

## `src/services/dashboard/build-contributors.ts`

```typescript
/**
 * Dashboard Aggregator V2 — contributor leaderboard from Developer Profiles.
 *
 * Sprint 3D Milestone 10B.
 */

import type { DeveloperProfile } from "@/services/developer-profile";

import type { ContributorRow } from "./types";
import { getInitials } from "./utils";

const DEFAULT_CONTRIBUTOR_LIMIT = 10;

/**
 * Sort key for contributor ranking:
 * 1. Engineering Score DESC (nulls last)
 * 2. Engineering Value Delivered DESC
 * 3. Developer Name ASC
 */
export function compareDeveloperProfilesForContributors(
  a: DeveloperProfile,
  b: DeveloperProfile
): number {
  const aScore = a.engineeringScore;
  const bScore = b.engineeringScore;

  if (aScore === null && bScore === null) {
    // fall through
  } else if (aScore === null) {
    return 1;
  } else if (bScore === null) {
    return -1;
  } else if (aScore !== bScore) {
    return bScore - aScore;
  }

  const aValue = a.evaluation.contribution.deliveredEngineeringHours;
  const bValue = b.evaluation.contribution.deliveredEngineeringHours;

  if (aValue !== bValue) {
    return bValue - aValue;
  }

  return a.evaluation.developer.localeCompare(b.evaluation.developer);
}

/**
 * Maps a Developer Profile to a ContributorRow presentation model.
 */
export function mapDeveloperProfileToContributor(
  profile: DeveloperProfile
): Omit<ContributorRow, "storiesMax" | "hoursMax"> {
  const deliveredHours =
    profile.evaluation.contribution.deliveredEngineeringHours;

  return {
    name: profile.evaluation.developer,
    initials: getInitials(profile.evaluation.developer),
    stories: profile.evaluation.contribution.completedTasks,
    hours: Math.round(deliveredHours),
    efficiency: Math.round(profile.engineeringScore ?? 0),
  };
}

/**
 * Builds the Top Contributors table from Developer Profiles.
 *
 * Sort: Engineering Score DESC → Engineering Value Delivered DESC → Name ASC.
 * Returns at most `limit` rows (default 10). Returns fewer when fewer exist.
 */
export function buildContributorsFromProfiles(
  profiles: readonly DeveloperProfile[],
  limit: number = DEFAULT_CONTRIBUTOR_LIMIT
): ContributorRow[] {
  const sorted = [...profiles]
    .sort(compareDeveloperProfilesForContributors)
    .slice(0, Math.max(0, limit))
    .map(mapDeveloperProfileToContributor);

  const storiesMax = Math.max(...sorted.map((row) => row.stories), 1);
  const hoursMax = Math.max(...sorted.map((row) => row.hours), 1);

  return sorted.map((row) => ({
    ...row,
    storiesMax,
    hoursMax,
  }));
}
```

## `src/services/dashboard/build-executive-brief.ts`

```typescript
/**
 * Dashboard Aggregator V2 — rule-based Executive Brief.
 *
 * Sprint 3D Milestone 10B. Always emits exactly four insights. No AI.
 */

import type { TechnologyProfile } from "@/services/technology-profile";
import { TECHNOLOGY_STATUS_THRESHOLDS } from "@/services/technology-profile";

import type { EngineeringInsight } from "./types";

/**
 * Selects the technology with the highest Engineering Health.
 * Null health is ignored. Ties break by Engineering Value Delivered DESC,
 * then technology name ASC.
 */
export function selectBestPerformingTechnology(
  profiles: readonly TechnologyProfile[]
): TechnologyProfile | null {
  const scored = profiles.filter(
    (profile) => profile.engineeringHealth !== null
  );

  if (scored.length === 0) {
    return null;
  }

  return [...scored].sort((a, b) => {
    const healthDiff =
      (b.engineeringHealth as number) - (a.engineeringHealth as number);
    if (healthDiff !== 0) {
      return healthDiff;
    }

    if (a.engineeringValueDeliveredHours !== b.engineeringValueDeliveredHours) {
      return b.engineeringValueDeliveredHours - a.engineeringValueDeliveredHours;
    }

    return a.technology.localeCompare(b.technology);
  })[0];
}

/**
 * Selects the technology with the highest Engineering Value Delivered.
 * Ties break by Engineering Health DESC (nulls last), then name ASC.
 */
export function selectHighestValueTechnology(
  profiles: readonly TechnologyProfile[]
): TechnologyProfile | null {
  if (profiles.length === 0) {
    return null;
  }

  return [...profiles].sort((a, b) => {
    if (a.engineeringValueDeliveredHours !== b.engineeringValueDeliveredHours) {
      return b.engineeringValueDeliveredHours - a.engineeringValueDeliveredHours;
    }

    const aHealth = a.engineeringHealth;
    const bHealth = b.engineeringHealth;

    if (aHealth === null && bHealth === null) {
      // fall through
    } else if (aHealth === null) {
      return 1;
    } else if (bHealth === null) {
      return -1;
    } else if (aHealth !== bHealth) {
      return bHealth - aHealth;
    }

    return a.technology.localeCompare(b.technology);
  })[0];
}

/**
 * Selects a technology below the Monitor threshold (engineeringHealth < 60).
 * Prefers the lowest health. Ties break by name ASC.
 */
export function selectAttentionTechnology(
  profiles: readonly TechnologyProfile[]
): TechnologyProfile | null {
  const belowMonitor = profiles.filter(
    (profile) =>
      profile.engineeringHealth !== null &&
      profile.engineeringHealth < TECHNOLOGY_STATUS_THRESHOLDS.monitor
  );

  if (belowMonitor.length === 0) {
    return null;
  }

  return [...belowMonitor].sort((a, b) => {
    const healthDiff =
      (a.engineeringHealth as number) - (b.engineeringHealth as number);
    if (healthDiff !== 0) {
      return healthDiff;
    }

    return a.technology.localeCompare(b.technology);
  })[0];
}

/**
 * Selects the technology with the highest Recovery Hours.
 * Ties break by name ASC.
 */
export function selectRecoveryFocusTechnology(
  profiles: readonly TechnologyProfile[]
): TechnologyProfile | null {
  if (profiles.length === 0) {
    return null;
  }

  return [...profiles].sort((a, b) => {
    if (a.recoveryHours !== b.recoveryHours) {
      return b.recoveryHours - a.recoveryHours;
    }

    return a.technology.localeCompare(b.technology);
  })[0];
}

/**
 * Returns true when every technology profile has status Healthy.
 * Empty technology lists are not considered all-healthy.
 */
export function allTechnologiesHealthy(
  profiles: readonly TechnologyProfile[]
): boolean {
  return (
    profiles.length > 0 &&
    profiles.every((profile) => profile.status === "Healthy")
  );
}

/**
 * Builds exactly four Executive Brief insights from Technology Profiles.
 *
 * 1. Best Performing Technology
 * 2. Highest Engineering Value Delivered
 * 3. Engineering Attention (or all-healthy message)
 * 4. Recovery Focus
 */
export function buildExecutiveBrief(
  technologyProfiles: readonly TechnologyProfile[]
): EngineeringInsight[] {
  const best = selectBestPerformingTechnology(technologyProfiles);
  const highestValue = selectHighestValueTechnology(technologyProfiles);
  const attention = selectAttentionTechnology(technologyProfiles);
  const recoveryFocus = selectRecoveryFocusTechnology(technologyProfiles);

  const insight1: EngineeringInsight = best
    ? {
        id: "best-technology",
        title: "Best Performing Technology",
        description: `${best.technology} leads with Engineering Health of ${formatHealth(best.engineeringHealth)}.`,
        tone: "success",
      }
    : {
        id: "best-technology",
        title: "Best Performing Technology",
        description:
          "No technology health scores are available for this reporting period.",
        tone: "info",
      };

  const insight2: EngineeringInsight = highestValue
    ? {
        id: "highest-value",
        title: "Highest Engineering Value Delivered",
        description: `${highestValue.technology} delivered ${formatHours(highestValue.engineeringValueDeliveredHours)} of engineering value.`,
        tone: "info",
      }
    : {
        id: "highest-value",
        title: "Highest Engineering Value Delivered",
        description:
          "No engineering value was delivered in this reporting period.",
        tone: "info",
      };

  const insight3: EngineeringInsight = attention
    ? {
        id: "engineering-attention",
        title: "Engineering Attention",
        description: `${attention.technology} is below the Monitor threshold with Engineering Health of ${formatHealth(attention.engineeringHealth)}. Prioritize recovery of delivery health.`,
        tone: "warning",
      }
    : allTechnologiesHealthy(technologyProfiles)
      ? {
          id: "engineering-attention",
          title: "Engineering Attention",
          description:
            "All engineering teams maintained Healthy status this reporting period.",
          tone: "success",
        }
      : {
          id: "engineering-attention",
          title: "Engineering Attention",
          description:
            "All engineering teams maintained Stable status or above this reporting period.",
          tone: "info",
        };

  const insight4: EngineeringInsight =
    recoveryFocus && recoveryFocus.recoveryHours > 0
      ? {
          id: "recovery-focus",
          title: "Recovery Focus",
          description: `${recoveryFocus.technology} recorded the highest recovery effort at ${formatHours(recoveryFocus.recoveryHours)}.`,
          tone: "warning",
        }
      : {
          id: "recovery-focus",
          title: "Recovery Focus",
          description:
            "No recovery effort was recorded across technologies this reporting period.",
          tone: "info",
        };

  return [insight1, insight2, insight3, insight4];
}

function formatHealth(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatHours(value: number): string {
  if (Number.isInteger(value)) {
    return `${value}h`;
  }

  return `${value.toFixed(1)}h`;
}
```

## `src/services/dashboard/build-dashboard-data.ts`

```typescript
/**
 * Dashboard Aggregator V2 — builds DashboardData from Analytics Snapshot.
 *
 * Sprint 3D Milestone 10B.
 *
 * Pipeline:
 *   Analytics Snapshot → Dashboard Aggregator → DashboardData → React
 *
 * Does not modify React components, dashboard-mock, or analytics engines.
 * Does not recalculate technology metrics — maps Technology Profiles only.
 * Does not modify existing trend builders (historical analytics out of scope).
 */

import type { AnalyticsSnapshot } from "@/services/snapshot";
import type {
  TechnologyProfile,
  TechnologyStatus,
} from "@/services/technology-profile";
import type { MetricStatus } from "@/types/dashboard";

import { buildContributorsFromProfiles } from "./build-contributors";
import { buildExecutiveBrief } from "./build-executive-brief";
import {
  weightedAverageEngineeringScore,
  buildKpisFromSnapshot,
  sumEngineeringValueDeliveredHours,
  weightedAverageQuality,
} from "./build-kpis";
import type {
  DashboardData,
  EngineeringScoreData,
  ScoreComponents,
  TechnologyCardData,
  TrendChartData,
} from "./types";
import { statusFromPercent, TECH_CHART_COLORS, TECH_NAME_TO_ID } from "./utils";

/**
 * Maps Technology Profile status to dashboard MetricStatus.
 */
export function mapTechnologyStatusToMetricStatus(
  status: TechnologyStatus
): MetricStatus {
  switch (status) {
    case "Healthy":
      return "healthy";
    case "Stable":
      return "on-track";
    case "Monitor":
      return "attention";
    case "Critical":
      return "attention";
    case "No Data":
      return "neutral";
  }
}

/**
 * Maps a Technology Profile to TechnologyCardData without recalculating metrics.
 */
export function mapTechnologyProfileToCard(
  profile: TechnologyProfile
): TechnologyCardData {
  const id = TECH_NAME_TO_ID[profile.technology] ?? profile.technology.toLowerCase();
  const healthScore = profile.engineeringHealth ?? 0;

  return {
    id,
    name: profile.technology,
    status: mapTechnologyStatusToMetricStatus(profile.status),
    statusLabel: profile.status,
    developers: profile.developerCount,
    hours: Math.round(profile.engineeringValueDeliveredHours),
    stories: 0,
    efficiency: Math.round(profile.execution ?? 0),
    sparkline:
      profile.engineeringHealth === null ? [] : [profile.engineeringHealth],
    chartColor: TECH_CHART_COLORS[id] ?? "var(--chart-2)",
    healthScore: Math.round(healthScore),
  };
}

/**
 * Placeholder trends for Milestone 10B.
 * Existing trend builders are unchanged; historical analytics are out of scope.
 */
export function buildPlaceholderTrends(): {
  deliveryTrend: TrendChartData;
  productivityTrend: TrendChartData;
} {
  return {
    deliveryTrend: {
      title: "Delivery Trend",
      description: "Historical delivery analytics are outside this milestone",
      dropdown: "Stories",
      data: [],
    },
    productivityTrend: {
      title: "Productivity Trend",
      description:
        "Historical productivity analytics are outside this milestone",
      dropdown: "Productivity",
      data: [],
    },
  };
}

function buildEngineeringScoreData(
  averageScore: number | null
): EngineeringScoreData {
  if (averageScore === null) {
    return {
      value: 0,
      trend: "neutral",
      status: "No Data",
      sparkline: [],
    };
  }

  const { label } = statusFromPercent(averageScore);

  return {
    value: Math.round(averageScore),
    trend: "neutral",
    status: label,
    sparkline: [averageScore],
  };
}

function buildScoreComponentsFromSnapshot(
  developerProfiles: AnalyticsSnapshot["developerProfiles"]
): ScoreComponents {
  const health = weightedAverageEngineeringScore(developerProfiles);
  const quality = weightedAverageQuality(developerProfiles);
  const valueHours = sumEngineeringValueDeliveredHours(developerProfiles);

  return {
    deliveryHealth: health ?? 0,
    productivity: health ?? 0,
    quality: quality ?? 0,
    contribution: Math.min(valueHours, 100),
    utilization: 0,
    riskHealth: 100,
  };
}

/**
 * Builds {@link DashboardData} from an {@link AnalyticsSnapshot}.
 *
 * Uses developer and technology profiles from the snapshot.
 * Does not read or mutate `snapshot.dashboardData` (avoids circular projection).
 *
 * Trends are placeholders — existing trend builders are not modified.
 */
export function buildDashboardDataFromSnapshot(
  snapshot: AnalyticsSnapshot
): DashboardData {
  const { developerProfiles, technologyProfiles, reportingPeriod, generatedAt } =
    snapshot;

  const kpis = buildKpisFromSnapshot({
    developerProfiles,
    generatedAt,
  });

  const contributors = buildContributorsFromProfiles(developerProfiles);
  const technologies = technologyProfiles.map(mapTechnologyProfileToCard);
  const insights = buildExecutiveBrief(technologyProfiles);
  const { deliveryTrend, productivityTrend } = buildPlaceholderTrends();

  const averageScore = weightedAverageEngineeringScore(developerProfiles);

  return {
    engineeringScore: buildEngineeringScoreData(averageScore),
    scoreComponents: buildScoreComponentsFromSnapshot(developerProfiles),
    kpis,
    deliveryTrend,
    productivityTrend,
    technologies,
    contributors,
    insights,
    reportingPeriod: { ...reportingPeriod },
    updatedAt: generatedAt,
  };
}
```

## `src/services/dashboard/index.ts`

```typescript
/**
 * Dashboard services — public module entry.
 *
 * Milestone 10B adds Dashboard Aggregator V2 (snapshot → DashboardData).
 * Legacy `getDashboardData` remains available via dashboard-aggregator.ts
 * for the current React page until snapshot wiring replaces it.
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
export {
  buildExecutiveBrief,
  allTechnologiesHealthy,
  selectAttentionTechnology,
  selectBestPerformingTechnology,
  selectHighestValueTechnology,
  selectRecoveryFocusTechnology,
} from "./build-executive-brief";
export {
  weightedAverageEngineeringScore,
  buildKpisFromSnapshot,
  sumEngineeringValueDeliveredHours,
  sumRecoveryHours,
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

# 9 Validation

### Example 1 — Engineering Health (weighted)

Scores 95@100h, 85@60h, 90@80h → Health = (95×100 + 85×60 + 90×80) / 240 = **91.25**

### Example 2 — Engineering Value Delivered

Hours 100 + 60 + 80 → **240h**

### Example 3 — Weighted Quality

(100×100 + 90×60 + 80×80) / 240 = **90.833…**

### Example 4 — Recovery

5 + 12 + 3 = **20h**

### Example 5 — KPI generatedAt

Snapshot `generatedAt = "2026-07-11T09:00:00.000Z"` → every KPI has the same `generatedAt`.

### Example 6 — Contributor sorting

| Dev | Score | Value |
|-----|-------|-------|
| A | 95 | 50 |
| B | 95 | 80 |
| C | 90 | 100 |

Order: **B, A, C** (score DESC, then value DESC)

### Example 7 — Tie-break by name

Score 90 / Value 40 for both Ada and Ben → **Ada, Ben**

### Example 8 — Technology mapping

Magento health 91.25, value 160, status Healthy → card `healthScore: 91`, `hours: 160`, `statusLabel: "Healthy"` (no recalculation)

### Example 9 — Best Performing Technology

Magento 92, React 88, HTML 85 → insight cites **Magento**

### Example 10 — Highest Value + Recovery Focus

Magento value 200 / recovery 8; React value 150 / recovery 20 → Value insight **Magento**, Recovery insight **React**

### Example 11 — Engineering Attention

DT health 52 (< 60) → attention insight cites **DT**

### Example 12 — All above Monitor

All techs ≥ 60 with mixed Stable/Healthy → attention message: **"All engineering teams maintained Stable status or above this reporting period."**

All techs status Healthy → **"All engineering teams maintained Healthy status this reporting period."**

# 10 Edge Cases

## No developers

KPIs show "—" / 0h; contributors = []; engineering score status No Data; insights still return four items from technologies (or empty-tech fallbacks).

## No technologies

Technology cards = []; Executive Brief uses null-safe fallback copy for all four insights.

## No recovery

Recovery KPI = `0h` / status None; Recovery Focus insight uses the no-recovery message.

## All technologies healthy (none below Monitor)

Engineering Attention uses the all-healthy success message.

## Less than 10 contributors

Returns all available profiles after sort (e.g. 3 developers → 3 rows).

# 11 Architecture Diagram

```
Jira
    ↓
Analytics Engines
    ↓
Analytics Snapshot
    ↓
Dashboard Aggregator
    ↓
DashboardData
    ↓
React
```

# 12 Build Output

```
> teampulse@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 5.1s
  Running TypeScript ...
  Finished TypeScript in 5.6s ...
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
✓ Generating static pages using 7 workers (15/15) in 20.7s
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

- KPI `id`s reuse legacy slots (`delivery-health`, etc.) for React icon compatibility; titles carry Milestone 10B meaning.
- Trends are empty placeholders; historical analytics deferred.
- Page still uses V1 `getDashboardData()` — V2 is not wired into React yet (intentionally).
- `scoreComponents.contribution` uses `min(valueHours, 100)` as a presentation fill, not a true capacity-normalized contribution score.

## Future improvements

- Wire snapshot store → `buildDashboardDataFromSnapshot` → dashboard page.
- Dedicated KPI id union once React icons are updated.
- Pass-through of snapshot trends when historical engine exists.

## Technical debt

- Dual V1/V2 dashboard paths until mock/live cutover.
- Technology cards set `stories: 0` because Technology Profile has no story count (by design).
