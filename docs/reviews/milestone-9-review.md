# Review Checklist

- [ ] Architecture
- [ ] Business Rules
- [ ] Strong Typing
- [ ] Pure Functions
- [ ] Build Passes
- [ ] Documentation Updated

# 1 Objective

Implement the **Technology Aggregation Engine** for Sprint 3C Milestone 9. This module aggregates Developer Profiles into Technology Profiles (Magento, React JS, HTML, DT). It does **not** modify existing metric engines, dashboard UI, or the ExecutiveDashboard component.

# 2 Architecture

The Technology Aggregation Engine lives under `src/services/technology-profile/` as a pure Aggregation Layer module that consumes Developer Profiles from Milestone 8A/8B.

```
technology-profile/
├── types.ts                      # TechnologyProfile, status, technology names
├── weighted-average.ts           # Shared weighted-average helper
├── status.ts                     # Healthy / Stable / Monitor / Critical / No Data
├── ranking.ts                    # Dense ranking (health DESC, value DESC)
├── build-technology-profile.ts   # Aggregation orchestrator
└── index.ts                      # Public module exports
```

## Data flow

```
Developer Profile
    ↓
Technology Aggregation
    ↓
Technology Profile
```

## Why weighted averages were selected

Simple averages would let low-volume developers distort technology health equally with high-volume contributors. Weighting by **Engineering Value Delivered** (Delivered Engineering Hours) ensures developers who deliver more planned engineering value influence Technology Health, Execution, and Quality proportionally — matching the Milestone 9 business rules and avoiding Story Count / Worklog Hours as proxies.

# 3 Business Rules

| Rule | Implementation |
|------|----------------|
| One profile per Magento / React JS / HTML / DT | `TECHNOLOGY_NAMES` + always emit all four |
| Technology Health = weighted Engineering Score | `collectHealthEntries` + `weightedAverage` |
| Weight = Delivered Engineering Hours | `getDeliveredEngineeringHours` |
| Execution / Quality weighted the same way | `collectExecutionEntries` / `collectQualityEntries` |
| Engineering Value Delivered = sum of delivered hours | `sumEngineeringValueDelivered` |
| Never Story Count or Worklog Hours | Only `contribution.deliveredEngineeringHours` |
| Recovery Hours (sum) + Recovery % | `sumRecoveryHours` + `calculateRecoveryPercentage` |
| Developer Count from Team Mapping | `getMappedDeveloperCount()` via `TEAM_MAPPING` |
| Status bands Healthy / Stable / Monitor / Critical / No Data | `resolveTechnologyStatus` |
| Dense rank by health DESC, value DESC | `assignTechnologyDenseRanks` |
| Missing scores ignored (not zero) | Null scores / unresolved metrics skipped |

# 4 Files Created

| File | Purpose |
|------|---------|
| `src/services/technology-profile/types.ts` | TechnologyProfile and supporting types |
| `src/services/technology-profile/weighted-average.ts` | Weighted average helper |
| `src/services/technology-profile/status.ts` | Technology status bands |
| `src/services/technology-profile/ranking.ts` | Dense technology ranking |
| `src/services/technology-profile/build-technology-profile.ts` | Aggregation orchestrator |
| `src/services/technology-profile/index.ts` | Public module exports |
| `docs/reviews/milestone-9-review.md` | This review package |

# 5 Files Modified

| File | Change |
|------|--------|
| `docs/Glossary.md` | Added Technology Profile and Technology Health |
| `docs/Engineering-Metrics-Specification.md` | Added Technology Profile aggregation section |
| `docs/reviews/README.md` | Linked milestone-9-review.md |

# 6 Files Deleted

None.

# 7 Public Interfaces

```typescript
const TECHNOLOGY_NAMES: readonly TechnologyName[];
const TECHNOLOGY_STATUS_THRESHOLDS: { healthy: 90; stable: 75; monitor: 60 };

type TechnologyName = "Magento" | "React JS" | "HTML" | "DT";
type TechnologyStatus = "Healthy" | "Stable" | "Monitor" | "Critical" | "No Data";
type BuildTechnologyProfilesInput = readonly DeveloperProfile[];

interface WeightedValue {
  value: number;
  weight: number;
}

interface TechnologyProfile {
  technology: TechnologyName;
  developerCount: number;
  engineeringHealth: number | null;
  execution: number | null;
  quality: number | null;
  engineeringValueDeliveredHours: number;
  recoveryHours: number;
  recoveryPercentage: number;
  status: TechnologyStatus;
  rank: number | null;
}

function weightedAverage(entries: readonly WeightedValue[]): number | null;
function resolveTechnologyStatus(engineeringHealth: number | null): TechnologyStatus;
function assignTechnologyDenseRanks(profiles: readonly TechnologyProfile[]): TechnologyProfile[];

function buildTechnologyProfiles(profiles: readonly DeveloperProfile[]): TechnologyProfile[];
function buildTechnologyProfile(
  technology: TechnologyName,
  profiles: readonly DeveloperProfile[],
  totalRecoveryHours: number
): TechnologyProfile;

function groupProfilesByTechnology(
  profiles: readonly DeveloperProfile[]
): Record<TechnologyName, DeveloperProfile[]>;

function getMappedDeveloperCount(technology: TechnologyName): number;
function getDeliveredEngineeringHours(profile: DeveloperProfile): number;
function getRecoveryHours(profile: DeveloperProfile): number;
function sumEngineeringValueDelivered(profiles: readonly DeveloperProfile[]): number;
function sumRecoveryHours(profiles: readonly DeveloperProfile[]): number;
function calculateRecoveryPercentage(
  technologyRecoveryHours: number,
  totalRecoveryHours: number
): number;

function collectHealthEntries(profiles: readonly DeveloperProfile[]): WeightedValue[];
function collectExecutionEntries(profiles: readonly DeveloperProfile[]): WeightedValue[];
function collectQualityEntries(profiles: readonly DeveloperProfile[]): WeightedValue[];
```

# 8 Complete Source Code

## `src/services/technology-profile/types.ts`

```typescript
/**
 * Technology Aggregation Engine — type definitions.
 *
 * Sprint 3C Milestone 9 aggregates Developer Profiles into Technology Profiles.
 */

import type { DeveloperProfile } from "@/services/developer-profile";

/** Canonical technology disciplines in TeamPulse. */
export type TechnologyName = "Magento" | "React JS" | "HTML" | "DT";

/**
 * Ordered list of technologies that always receive a profile,
 * even when no developers are present.
 */
export const TECHNOLOGY_NAMES: readonly TechnologyName[] = [
  "Magento",
  "React JS",
  "HTML",
  "DT",
] as const;

/**
 * Technology health status bands.
 *
 * | Score        | Status   |
 * |--------------|----------|
 * | ≥ 90         | Healthy  |
 * | 75 – 89.99   | Stable   |
 * | 60 – 74.99   | Monitor  |
 * | < 60         | Critical |
 * | null         | No Data  |
 */
export type TechnologyStatus =
  | "Healthy"
  | "Stable"
  | "Monitor"
  | "Critical"
  | "No Data";

/**
 * Aggregated technology object used throughout TeamPulse.
 *
 * Derived from Developer Profiles for a single technology discipline.
 * Recovery is informational and does not affect engineeringHealth.
 */
export interface TechnologyProfile {
  /** Technology discipline name. */
  technology: TechnologyName;
  /**
   * Total developers mapped to this technology in Team Mapping.
   * Source of truth is TEAM_MAPPING — not the aggregated profile count.
   */
  developerCount: number;
  /**
   * Weighted Engineering Score (weight = Delivered Engineering Hours).
   * Null when no developers contribute positive engineering value.
   */
  engineeringHealth: number | null;
  /**
   * Weighted Execution Efficiency (weight = Delivered Engineering Hours).
   * Null when no resolved execution scores have positive weight.
   */
  execution: number | null;
  /**
   * Weighted Delivery Quality (weight = Delivered Engineering Hours).
   * Null when no resolved quality scores have positive weight.
   */
  quality: number | null;
  /**
   * Sum of Delivered Engineering Hours across developers.
   * Never Story Count or Worklog Hours.
   */
  engineeringValueDeliveredHours: number;
  /** Sum of developer Recovery Hours for this technology. */
  recoveryHours: number;
  /**
   * Share of total recovery across all technologies:
   * (technologyRecoveryHours / totalRecoveryHours) × 100.
   * Zero when total recovery is zero.
   */
  recoveryPercentage: number;
  /** Status derived from engineeringHealth bands. */
  status: TechnologyStatus;
  /**
   * Dense rank among technologies (1 = healthiest).
   * Null until ranking is applied.
   */
  rank: number | null;
}

/** A value/weight pair for weighted-average calculation. */
export interface WeightedValue {
  value: number;
  weight: number;
}

/** Inputs for building technology profiles from developer profiles. */
export type BuildTechnologyProfilesInput = readonly DeveloperProfile[];
```

## `src/services/technology-profile/weighted-average.ts`

```typescript
import type { WeightedValue } from "./types";

/**
 * Calculates a weighted average.
 *
 *   Σ (value × weight) / Σ weight
 *
 * Entries with weight ≤ 0 are ignored.
 * Returns null when no positive-weight entries remain
 * (missing data is never treated as zero).
 */
export function weightedAverage(
  entries: readonly WeightedValue[]
): number | null {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const entry of entries) {
    if (entry.weight <= 0) {
      continue;
    }

    weightedSum += entry.value * entry.weight;
    totalWeight += entry.weight;
  }

  if (totalWeight <= 0) {
    return null;
  }

  return weightedSum / totalWeight;
}
```

## `src/services/technology-profile/status.ts`

```typescript
/**
 * Technology Profile status resolution.
 *
 * Status bands (Milestone 9):
 * | Score        | Status   |
 * |--------------|----------|
 * | ≥ 90         | Healthy  |
 * | 75 – 89.99   | Stable   |
 * | 60 – 74.99   | Monitor  |
 * | < 60         | Critical |
 * | null         | No Data  |
 *
 * When engineering health is null (no contribution), status is No Data.
 */

import type { TechnologyStatus } from "./types";

/** Status band thresholds for Technology Health. */
export const TECHNOLOGY_STATUS_THRESHOLDS = {
  healthy: 90,
  stable: 75,
  monitor: 60,
} as const;

/**
 * Maps Technology Health to a {@link TechnologyStatus} band.
 *
 * Pass `null` when no developers contribute engineering value —
 * resolves to "No Data".
 */
export function resolveTechnologyStatus(
  engineeringHealth: number | null
): TechnologyStatus {
  if (engineeringHealth === null) {
    return "No Data";
  }

  const { healthy, stable, monitor } = TECHNOLOGY_STATUS_THRESHOLDS;

  if (engineeringHealth >= healthy) {
    return "Healthy";
  }

  if (engineeringHealth >= stable) {
    return "Stable";
  }

  if (engineeringHealth >= monitor) {
    return "Monitor";
  }

  return "Critical";
}
```

## `src/services/technology-profile/ranking.ts`

```typescript
import type { TechnologyProfile } from "./types";

/**
 * Ranking key for dense technology ranking.
 *
 * Primary: Technology Health DESC (nulls last)
 * Secondary: Engineering Value Delivered DESC
 */
function compareTechnologyProfiles(
  a: TechnologyProfile,
  b: TechnologyProfile
): number {
  const aHealth = a.engineeringHealth;
  const bHealth = b.engineeringHealth;

  if (aHealth === null && bHealth === null) {
    // fall through to value
  } else if (aHealth === null) {
    return 1;
  } else if (bHealth === null) {
    return -1;
  } else if (aHealth !== bHealth) {
    return bHealth - aHealth;
  }

  if (a.engineeringValueDeliveredHours !== b.engineeringValueDeliveredHours) {
    return b.engineeringValueDeliveredHours - a.engineeringValueDeliveredHours;
  }

  return a.technology.localeCompare(b.technology);
}

/**
 * Returns true when two profiles share the same ranking key
 * (health + engineering value delivered).
 */
function sameRankKey(a: TechnologyProfile, b: TechnologyProfile): boolean {
  return (
    a.engineeringHealth === b.engineeringHealth &&
    a.engineeringValueDeliveredHours === b.engineeringValueDeliveredHours
  );
}

/**
 * Assigns dense ranks to technology profiles.
 *
 * Sort order:
 * 1. Technology Health DESC (nulls last)
 * 2. Engineering Value Delivered DESC
 *
 * Dense ranking: equal keys share a rank; the next distinct key
 * receives the next consecutive integer (no gaps).
 *
 * Returns new profile objects — does not mutate inputs.
 */
export function assignTechnologyDenseRanks(
  profiles: readonly TechnologyProfile[]
): TechnologyProfile[] {
  const ordered = [...profiles].sort(compareTechnologyProfiles);

  const ranked: TechnologyProfile[] = [];
  let currentRank = 0;
  let previous: TechnologyProfile | null = null;

  for (const profile of ordered) {
    if (previous === null || !sameRankKey(previous, profile)) {
      currentRank += 1;
      previous = profile;
    }

    ranked.push({
      ...profile,
      rank: currentRank,
    });
  }

  return ranked;
}
```

## `src/services/technology-profile/build-technology-profile.ts`

```typescript
import type { DeveloperProfile } from "@/services/developer-profile";
import { TEAM_MAPPING } from "@/config/team-mapping";

import { assignTechnologyDenseRanks } from "./ranking";
import { resolveTechnologyStatus } from "./status";
import {
  TECHNOLOGY_NAMES,
  type TechnologyName,
  type TechnologyProfile,
  type WeightedValue,
} from "./types";
import { weightedAverage } from "./weighted-average";

/**
 * Returns the mapped developer count for a technology from Team Mapping.
 *
 * Team Mapping is the source of truth — not the aggregated profile count.
 */
export function getMappedDeveloperCount(technology: TechnologyName): number {
  return TEAM_MAPPING[technology].length;
}

/**
 * Returns Delivered Engineering Hours for a developer profile.
 * This is Engineering Value Delivered — never worklog hours or story count.
 */
export function getDeliveredEngineeringHours(
  profile: DeveloperProfile
): number {
  return profile.evaluation.contribution.deliveredEngineeringHours;
}

/**
 * Returns Recovery Hours for a developer profile.
 */
export function getRecoveryHours(profile: DeveloperProfile): number {
  return profile.evaluation.recovery.totalRecoveryHours;
}

/**
 * Groups developer profiles by canonical technology name.
 * Profiles with unmapped / unknown technology are excluded from technology buckets.
 */
export function groupProfilesByTechnology(
  profiles: readonly DeveloperProfile[]
): Record<TechnologyName, DeveloperProfile[]> {
  const groups: Record<TechnologyName, DeveloperProfile[]> = {
    Magento: [],
    "React JS": [],
    HTML: [],
    DT: [],
  };

  for (const profile of profiles) {
    const technology = profile.evaluation.technology;

    if (technology in groups) {
      groups[technology as TechnologyName].push(profile);
    }
  }

  return groups;
}

/**
 * Sums Delivered Engineering Hours across profiles.
 */
export function sumEngineeringValueDelivered(
  profiles: readonly DeveloperProfile[]
): number {
  return profiles.reduce(
    (total, profile) => total + getDeliveredEngineeringHours(profile),
    0
  );
}

/**
 * Sums Recovery Hours across profiles.
 */
export function sumRecoveryHours(
  profiles: readonly DeveloperProfile[]
): number {
  return profiles.reduce(
    (total, profile) => total + getRecoveryHours(profile),
    0
  );
}

/**
 * Recovery Percentage for a technology:
 *   (technologyRecoveryHours / totalRecoveryHours) × 100
 *
 * Returns 0 when total recovery is zero.
 */
export function calculateRecoveryPercentage(
  technologyRecoveryHours: number,
  totalRecoveryHours: number
): number {
  if (totalRecoveryHours <= 0) {
    return 0;
  }

  return (technologyRecoveryHours / totalRecoveryHours) * 100;
}

/**
 * Builds weighted-average entries for Engineering Health.
 * Skips developers with null Engineering Score (missing data ≠ zero).
 * Weight = Delivered Engineering Hours.
 */
export function collectHealthEntries(
  profiles: readonly DeveloperProfile[]
): WeightedValue[] {
  const entries: WeightedValue[] = [];

  for (const profile of profiles) {
    if (profile.engineeringScore === null) {
      continue;
    }

    entries.push({
      value: profile.engineeringScore,
      weight: getDeliveredEngineeringHours(profile),
    });
  }

  return entries;
}

/**
 * Builds weighted-average entries for Execution Efficiency.
 * Skips unresolved execution results. Weight = Delivered Engineering Hours.
 */
export function collectExecutionEntries(
  profiles: readonly DeveloperProfile[]
): WeightedValue[] {
  const entries: WeightedValue[] = [];

  for (const profile of profiles) {
    if (!profile.evaluation.execution.resolved) {
      continue;
    }

    entries.push({
      value: profile.evaluation.execution.efficiencyScore,
      weight: getDeliveredEngineeringHours(profile),
    });
  }

  return entries;
}

/**
 * Builds weighted-average entries for Delivery Quality.
 * Skips unresolved quality results. Weight = Delivered Engineering Hours.
 */
export function collectQualityEntries(
  profiles: readonly DeveloperProfile[]
): WeightedValue[] {
  const entries: WeightedValue[] = [];

  for (const profile of profiles) {
    if (!profile.evaluation.quality.resolved) {
      continue;
    }

    entries.push({
      value: profile.evaluation.quality.qualityScore,
      weight: getDeliveredEngineeringHours(profile),
    });
  }

  return entries;
}

/**
 * Assembles a single {@link TechnologyProfile} from developer profiles
 * belonging to one technology. Rank defaults to null.
 *
 * @param technology - Canonical technology name
 * @param profiles - Developer profiles mapped to this technology
 * @param totalRecoveryHours - Recovery hours across all technologies (denominator)
 */
export function buildTechnologyProfile(
  technology: TechnologyName,
  profiles: readonly DeveloperProfile[],
  totalRecoveryHours: number
): TechnologyProfile {
  const engineeringValueDeliveredHours =
    sumEngineeringValueDelivered(profiles);
  const recoveryHours = sumRecoveryHours(profiles);
  const engineeringHealth = weightedAverage(collectHealthEntries(profiles));
  const execution = weightedAverage(collectExecutionEntries(profiles));
  const quality = weightedAverage(collectQualityEntries(profiles));

  return {
    technology,
    developerCount: getMappedDeveloperCount(technology),
    engineeringHealth,
    execution,
    quality,
    engineeringValueDeliveredHours,
    recoveryHours,
    recoveryPercentage: calculateRecoveryPercentage(
      recoveryHours,
      totalRecoveryHours
    ),
    status: resolveTechnologyStatus(engineeringHealth),
    rank: null,
  };
}

/**
 * Aggregates Developer Profiles into Technology Profiles.
 *
 * Pipeline:
 * 1. Group profiles by technology (Magento, React JS, HTML, DT).
 * 2. Always emit one profile per technology (empty groups included).
 * 3. Compute weighted health / execution / quality (weight = delivered hours).
 * 4. Sum engineering value delivered and recovery hours.
 * 5. Compute recovery percentage against all-technology total.
 * 6. Assign dense ranks (health DESC, value DESC).
 *
 * Does not modify Developer Profiles, metric engines, or dashboard UI.
 */
export function buildTechnologyProfiles(
  profiles: readonly DeveloperProfile[]
): TechnologyProfile[] {
  const groups = groupProfilesByTechnology(profiles);
  const totalRecoveryHours = sumRecoveryHours(profiles);

  const technologyProfiles = TECHNOLOGY_NAMES.map((technology) =>
    buildTechnologyProfile(technology, groups[technology], totalRecoveryHours)
  );

  return assignTechnologyDenseRanks(technologyProfiles);
}
```

## `src/services/technology-profile/index.ts`

```typescript
/**
 * Technology Aggregation Engine — public module entry.
 *
 * Sprint 3C Milestone 9 aggregates Developer Profiles into Technology Profiles.
 *
 * Does not modify metric engines, dashboard services, or ExecutiveDashboard.
 */

export {
  buildTechnologyProfile,
  buildTechnologyProfiles,
  calculateRecoveryPercentage,
  collectExecutionEntries,
  collectHealthEntries,
  collectQualityEntries,
  getDeliveredEngineeringHours,
  getMappedDeveloperCount,
  getRecoveryHours,
  groupProfilesByTechnology,
  sumEngineeringValueDelivered,
  sumRecoveryHours,
} from "./build-technology-profile";
export { assignTechnologyDenseRanks } from "./ranking";
export {
  resolveTechnologyStatus,
  TECHNOLOGY_STATUS_THRESHOLDS,
} from "./status";
export { weightedAverage } from "./weighted-average";

export type {
  BuildTechnologyProfilesInput,
  TechnologyName,
  TechnologyProfile,
  TechnologyStatus,
  WeightedValue,
} from "./types";
export { TECHNOLOGY_NAMES } from "./types";
```

# 9 Mathematical Validation

### Example 1 — Weighted Engineering Health

Magento developers:

| Dev | Engineering Score | Delivered Hours |
|-----|-------------------|-----------------|
| A | 95 | 100 |
| B | 85 | 60 |

Health = (95×100 + 85×60) / (100+60) = **91.25** → Status **Healthy**

### Example 2 — Weighted Execution

| Dev | Efficiency | Delivered Hours |
|-----|------------|-----------------|
| A | 90 | 100 |
| B | 80 | 60 |

Execution = (90×100 + 80×60) / 160 = **86.25**

### Example 3 — Weighted Quality

| Dev | Quality | Delivered Hours |
|-----|---------|-----------------|
| A | 100 | 100 |
| B | 92 | 60 |

Quality = (100×100 + 92×60) / 160 = **97**

### Example 4 — Engineering Value Delivered

100 + 60 = **160** hours (not story count, not worklog hours)

### Example 5 — Recovery Percentage

Magento recovery = 12h, React JS recovery = 8h, total = 20h

Magento Recovery % = 12/20×100 = **60**

React JS Recovery % = 8/20×100 = **40**

### Example 6 — Equal weights

Scores 90 and 70, each 50h → Health = **80** → Status **Stable**

### Example 7 — Zero-weight developer skipped

Score 100 with 0h + Score 80 with 40h → Health = **80** (zero-weight ignored)

### Example 8 — No contribution

All delivered hours = 0 → Health = **null** → Status **No Data**

### Example 9 — Dense ranking

| Tech | Health | Value | Rank |
|------|--------|-------|------|
| Magento | 92 | 200 | **1** |
| React JS | 92 | 150 | **2** |
| HTML | 85 | 80 | **3** |
| DT | 85 | 80 | **3** |

Equal health+value share rank; next distinct key is consecutive (dense).

### Example 10 — Developer Count from Team Mapping

Magento TEAM_MAPPING has 8 developers → **developerCount = 8** (independent of how many profiles were aggregated)

### Example 11 — Monitor band

Single developer score 70, weight 100 → Health = **70** → Status **Monitor**

### Example 12 — Critical band

Scores 50 (30h) and 55 (20h) → Health = (50×30 + 55×20)/50 = **52** → Status **Critical**

# 10 Edge Cases

## No developers

Empty input still emits four Technology Profiles (Magento, React JS, HTML, DT) with `developerCount` from Team Mapping, null health/execution/quality, zero value/recovery, status No Data, and dense ranks among the empty set.

## No contribution

Developers present but all Delivered Engineering Hours = 0 → weighted averages return null → status No Data. Developer count still comes from Team Mapping.

## No recovery

Total recovery hours = 0 → every technology `recoveryPercentage = 0`. Recovery hours remain 0. Health is unaffected.

## Equal scores

Same `engineeringHealth` and same `engineeringValueDeliveredHours` → shared dense rank; next distinct pair gets the next integer.

## Missing developers

Profiles with unknown / empty technology are excluded from technology buckets (not forced into a discipline). Canonical technologies with no matching profiles still appear; `developerCount` comes from Team Mapping. Null Engineering Scores and unresolved execution/quality are skipped in weighted averages (never coerced to zero).

# 11 Architecture Diagram

```
Jira
    ↓
Developer Profiles
    ↓
Technology Profiles
    ↓
Dashboard Aggregator
```

# 12 Build Output

```
> teampulse@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 5.4s
  Running TypeScript ...
  Finished TypeScript in 4.9s ...
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
✓ Generating static pages using 7 workers (15/15) in 19.3s
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

- Not wired into the dashboard aggregator yet (intentionally out of scope).

## Future improvements

- Dashboard aggregator integration to replace legacy technology cards.
- Unit tests for weighted average, recovery %, and dense ranking edge cases.

## Technical debt

- Status thresholds are module constants rather than a shared config object (acceptable for Milestone 9; could align with `ENGINEERING_SCORE_CONFIG` style later).
- Ranking uses name as a final stable sort tie-break only; rank keys remain health + value.
