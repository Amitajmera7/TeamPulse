# Review Checklist

- [ ] Architecture follows TeamPulse standards
- [ ] Business rules match Engineering-Metrics-Specification.md
- [ ] Configuration-first
- [ ] Pure functions only
- [ ] Strong typing
- [ ] Build passes
- [ ] Documentation updated

# 1 Objective

Implement the **Engineering Score Engine** for Sprint 3B Milestone 8B. This completes the Developer Profile by calculating Engineering Score, status bands, and dense ranking. It does **not** modify existing metric engines or dashboard services.

# 2 Architecture

Engineering Score lives inside `src/services/developer-profile/` as the Aggregation Layer completion of Milestone 8A.

```
developer-profile/
├── config.ts                         # ENGINEERING_SCORE_CONFIG
├── normalize-weights.ts              # Dynamic weight normalization
├── calculate-engineering-score.ts    # Score + Contribution Score
├── ranking.ts                        # Dense ranking
├── status.ts                         # Score-band status resolution
├── types.ts                          # DeveloperEvaluation / DeveloperProfile
├── build-developer-evaluation.ts     # Intact engine assembly (8A)
├── build-developer-profile.ts        # Profile + score wiring
└── index.ts                          # Public module exports
```

## Why Engineering Score belongs inside Developer Profile

`DeveloperProfile` is the canonical developer object. Score, status, and rank are profile-level concerns derived from the already-aggregated `DeveloperEvaluation`. Keeping score here avoids a parallel scoring path and preserves Recovery as visible-but-excluded.

## Dynamic normalization

Raw weights (Execution 25, Quality 25, Contribution 20) are never used as hardcoded percentages. For each developer:

```
normalized(k) = rawWeight(k) / sum(rawWeights of available KPIs)
```

Missing KPIs are omitted and their weight redistributed. Developers are never penalized with a zero for missing data.

## Configuration-first design

All tunable values live in `ENGINEERING_SCORE_CONFIG`:

- `weights`
- `expectedEngineeringCapacityHours` (160)
- `statusThresholds` (90 / 75 / 60)

Formula code reads config only — no magic numbers in score or status logic.

## Dense ranking implementation

`assignDenseRanks()` sorts scored profiles descending by `engineeringScore`, assigns consecutive ranks for distinct scores, and shares rank for ties (95, 95, 92 → 1, 1, 2). No-Data profiles keep `rank: null` and are appended after scored peers.

# 3 Business Rules Implemented

| Rule | Implementation |
|------|----------------|
| Score from implemented KPIs only | `resolveAvailableKpis()` — execution / quality / contribution |
| Future KPIs ignored | Not in `weights`; documented as `FutureEngineeringScoreKpi` |
| Dynamic weight normalization | `normalizeWeights()` |
| Missing KPI ignored (not zero) | Omitted from available set; weight redistributed |
| Contribution Score from delivered hours / 160 | `calculateContributionScore()` |
| Cap Contribution Score at 100 | `Math.min(..., 100)` |
| Full-precision Engineering Score | No rounding in `calculateEngineeringScore()` |
| Status bands 90 / 75 / 60 | `resolveStatusFromScore()` via config thresholds |
| No Data for no completed work | `wrapDeveloperEvaluation()` short-circuit |
| Dense ranking | `assignDenseRanks()` |
| Recovery visible, not scored | Remains on evaluation; never in available KPIs |

# 4 Files Created

| File | Purpose |
|------|---------|
| `src/services/developer-profile/config.ts` | `ENGINEERING_SCORE_CONFIG` and related types |
| `src/services/developer-profile/normalize-weights.ts` | Dynamic weight normalization |
| `src/services/developer-profile/calculate-engineering-score.ts` | Engineering Score + Contribution Score |
| `src/services/developer-profile/ranking.ts` | Dense ranking |
| `docs/reviews/milestone-8B-review.md` | This review package |

# 5 Files Modified

| File | Change |
|------|--------|
| `src/services/developer-profile/types.ts` | Added score/rank fields and score result types |
| `src/services/developer-profile/status.ts` | Score-band status via config thresholds |
| `src/services/developer-profile/build-developer-profile.ts` | Wire Engineering Score into profile |
| `src/services/developer-profile/index.ts` | Export score, ranking, config APIs |
| `docs/Glossary.md` | Engineering Score, Dense Ranking, Profile updates |
| `docs/Engineering-Metrics-Specification.md` | Engineering Score (Developer) section |
| `docs/reviews/README.md` | Link milestone-8B-review.md |

# 6 Files Deleted

None.

# 7 Public Interfaces

```typescript
// Config
const ENGINEERING_SCORE_CONFIG: EngineeringScoreConfig;

type EngineeringScoreKpi = "execution" | "quality" | "contribution";
type FutureEngineeringScoreKpi = "compliance" | "utilization" | "aiInsights";

interface EngineeringScoreWeights {
  execution: number;
  quality: number;
  contribution: number;
}

interface EngineeringScoreStatusThresholds {
  healthy: number;
  good: number;
  needsAttention: number;
}

interface EngineeringScoreConfig {
  weights: EngineeringScoreWeights;
  expectedEngineeringCapacityHours: number;
  statusThresholds: EngineeringScoreStatusThresholds;
}

// Score
function calculateContributionScore(
  deliveredEngineeringHours: number,
  expectedEngineeringCapacityHours?: number
): number;

function resolveAvailableKpis(
  evaluation: DeveloperEvaluation
): EngineeringScoreKpi[];

function calculateEngineeringScore(
  evaluation: DeveloperEvaluation
): EngineeringScoreResult;

function normalizeWeights(
  availableKpis: readonly EngineeringScoreKpi[],
  weights?: EngineeringScoreWeights
): NormalizedWeights;

// Status
function hasCompletedWork(evaluation: DeveloperEvaluation): boolean;
function resolveStatusFromScore(score: number | null): DeveloperProfileStatus;
function resolveDeveloperProfileStatus(
  evaluation: DeveloperEvaluation,
  engineeringScore?: number | null
): DeveloperProfileStatus;

// Ranking
function assignDenseRanks(
  profiles: readonly DeveloperProfile[]
): DeveloperProfile[];

// Profile builders (updated)
function buildDeveloperProfile(input: BuildDeveloperEvaluationInput): DeveloperProfile;
function wrapDeveloperEvaluation(evaluation: DeveloperEvaluation): DeveloperProfile;
function buildDeveloperEvaluation(input: BuildDeveloperEvaluationInput): DeveloperEvaluation;

// Types
type DeveloperProfileStatus =
  | "Healthy" | "Good" | "Needs Attention" | "Critical" | "No Data";

type EngineeringScoreComponents = Partial<Record<EngineeringScoreKpi, number>>;
type NormalizedWeights = Partial<Record<EngineeringScoreKpi, number>>;

interface EngineeringScoreResult {
  score: number | null;
  components: EngineeringScoreComponents;
  normalizedWeights: NormalizedWeights;
}

interface DeveloperProfile {
  evaluation: DeveloperEvaluation;
  status: DeveloperProfileStatus;
  engineeringScore: number | null;
  engineeringScoreDetail: EngineeringScoreResult | null;
  rank: number | null;
}
```

# 8 Complete Source Code

## `src/services/developer-profile/config.ts`

```typescript
/**
 * Engineering Score configuration (Sprint 3B Milestone 8B).
 *
 * Score calculation must consume this object — never hardcode weights,
 * capacity, or status thresholds in formula code.
 */

/** Implemented KPI keys that currently participate in Engineering Score. */
export type EngineeringScoreKpi = "execution" | "quality" | "contribution";

/**
 * Future KPIs — ignored until implemented.
 * Listed here for documentation only; not included in {@link ENGINEERING_SCORE_CONFIG.weights}.
 */
export type FutureEngineeringScoreKpi =
  | "compliance"
  | "utilization"
  | "aiInsights";

/** Status band thresholds (score ≥ threshold maps to that band). */
export interface EngineeringScoreStatusThresholds {
  /** Score ≥ this value → Healthy. */
  healthy: number;
  /** Score ≥ this value (and < healthy) → Good. */
  good: number;
  /** Score ≥ this value (and < good) → Needs Attention. Below → Critical. */
  needsAttention: number;
}

/** Raw (pre-normalization) weights for implemented KPIs. */
export interface EngineeringScoreWeights {
  execution: number;
  quality: number;
  contribution: number;
}

export interface EngineeringScoreConfig {
  /**
   * Raw weights for implemented KPIs.
   *
   * Dynamic normalization redistributes these across only the KPIs
   * available for a given developer. Never hardcode normalized %.
   */
  weights: EngineeringScoreWeights;
  /** Expected delivered engineering hours per reporting month. */
  expectedEngineeringCapacityHours: number;
  /** Profile status bands derived from Engineering Score. */
  statusThresholds: EngineeringScoreStatusThresholds;
}

/**
 * Canonical Engineering Score configuration.
 *
 * Current implemented KPI weights: Execution 25, Quality 25, Contribution 20.
 * Future KPIs (Compliance, Utilization, AI Insights) are omitted until ready.
 */
export const ENGINEERING_SCORE_CONFIG: EngineeringScoreConfig = {
  weights: {
    execution: 25,
    quality: 25,
    contribution: 20,
  },
  expectedEngineeringCapacityHours: 160,
  statusThresholds: {
    healthy: 90,
    good: 75,
    needsAttention: 60,
  },
};
```

## `src/services/developer-profile/normalize-weights.ts`

```typescript
import type {
  EngineeringScoreKpi,
  EngineeringScoreWeights,
} from "./config";
import { ENGINEERING_SCORE_CONFIG } from "./config";
import type { NormalizedWeights } from "./types";

export type { NormalizedWeights };

/**
 * Dynamically normalizes raw KPI weights across only the available KPIs.
 *
 * Formula (for each available KPI k):
 *   normalized(k) = rawWeight(k) / sum(rawWeight of available KPIs)
 *
 * Missing KPIs are omitted — their weight is redistributed, never treated
 * as zero contribution to the denominator.
 *
 * Returns an empty object when no KPIs are available.
 */
export function normalizeWeights(
  availableKpis: readonly EngineeringScoreKpi[],
  weights: EngineeringScoreWeights = ENGINEERING_SCORE_CONFIG.weights
): NormalizedWeights {
  if (availableKpis.length === 0) {
    return {};
  }

  const unique = [...new Set(availableKpis)];
  const total = unique.reduce((sum, kpi) => sum + weights[kpi], 0);

  if (total <= 0) {
    return {};
  }

  const normalized: NormalizedWeights = {};

  for (const kpi of unique) {
    normalized[kpi] = weights[kpi] / total;
  }

  return normalized;
}
```

## `src/services/developer-profile/calculate-engineering-score.ts`

```typescript
import {
  ENGINEERING_SCORE_CONFIG,
  type EngineeringScoreKpi,
} from "./config";
import { normalizeWeights } from "./normalize-weights";
import type {
  DeveloperEvaluation,
  EngineeringScoreComponents,
  EngineeringScoreResult,
} from "./types";

export type { EngineeringScoreComponents, EngineeringScoreResult };

/**
 * Contribution Score from delivered engineering hours.
 *
 *   min(DeliveredEngineeringHours / ExpectedEngineeringCapacityHours × 100, 100)
 *
 * Does not use contributionPercentage from the Contribution engine.
 */
export function calculateContributionScore(
  deliveredEngineeringHours: number,
  expectedEngineeringCapacityHours: number = ENGINEERING_SCORE_CONFIG.expectedEngineeringCapacityHours
): number {
  if (expectedEngineeringCapacityHours <= 0) {
    return 0;
  }

  return Math.min(
    (deliveredEngineeringHours / expectedEngineeringCapacityHours) * 100,
    100
  );
}

/**
 * Resolves which implemented KPIs are available for scoring.
 *
 * - Execution: available when `execution.resolved`
 * - Quality: available when `quality.resolved`
 * - Contribution: available when the contribution result is resolved
 *   (zero delivered hours is a valid score of 0, not a missing KPI)
 *
 * Recovery is never included.
 */
export function resolveAvailableKpis(
  evaluation: DeveloperEvaluation
): EngineeringScoreKpi[] {
  const available: EngineeringScoreKpi[] = [];

  if (evaluation.execution.resolved) {
    available.push("execution");
  }

  if (evaluation.quality.resolved) {
    available.push("quality");
  }

  if (evaluation.contribution.resolved) {
    available.push("contribution");
  }

  return available;
}

/**
 * Calculates Engineering Score from a {@link DeveloperEvaluation}.
 *
 * Pipeline:
 * 1. Resolve available implemented KPIs (ignore missing; never treat as 0).
 * 2. Dynamically normalize configured weights across available KPIs only.
 * 3. Contribution Score = min(deliveredHours / expectedHours × 100, 100).
 * 4. Engineering Score = Σ (componentScore × normalizedWeight).
 * 5. Store full precision — UI rounding is deferred.
 *
 * Recovery does not affect Engineering Score.
 */
export function calculateEngineeringScore(
  evaluation: DeveloperEvaluation
): EngineeringScoreResult {
  const availableKpis = resolveAvailableKpis(evaluation);

  if (availableKpis.length === 0) {
    return {
      score: null,
      components: {},
      normalizedWeights: {},
    };
  }

  const components: EngineeringScoreComponents = {};

  if (availableKpis.includes("execution")) {
    components.execution = evaluation.execution.efficiencyScore;
  }

  if (availableKpis.includes("quality")) {
    components.quality = evaluation.quality.qualityScore;
  }

  if (availableKpis.includes("contribution")) {
    components.contribution = calculateContributionScore(
      evaluation.contribution.deliveredEngineeringHours,
      ENGINEERING_SCORE_CONFIG.expectedEngineeringCapacityHours
    );
  }

  const normalized = normalizeWeights(
    availableKpis,
    ENGINEERING_SCORE_CONFIG.weights
  );

  let score = 0;

  for (const kpi of availableKpis) {
    const component = components[kpi];
    const weight = normalized[kpi];

    if (component === undefined || weight === undefined) {
      continue;
    }

    score += component * weight;
  }

  return {
    score,
    components,
    normalizedWeights: normalized,
  };
}
```

## `src/services/developer-profile/ranking.ts`

```typescript
import type { DeveloperProfile } from "./types";

/**
 * Assigns dense ranks to developer profiles by Engineering Score.
 *
 * Dense ranking: equal scores share a rank; the next distinct score
 * receives the next consecutive integer (no gaps).
 *
 * Example: scores 95, 95, 92 → ranks 1, 1, 2
 *
 * Profiles with `engineeringScore === null` (No Data) receive `rank: null`
 * and are placed after scored profiles without participating in ranking.
 *
 * Returns new profile objects — does not mutate inputs.
 */
export function assignDenseRanks(
  profiles: readonly DeveloperProfile[]
): DeveloperProfile[] {
  const scored: DeveloperProfile[] = [];
  const unscored: DeveloperProfile[] = [];

  for (const profile of profiles) {
    if (profile.engineeringScore === null) {
      unscored.push({ ...profile, rank: null });
    } else {
      scored.push(profile);
    }
  }

  const ordered = [...scored].sort((a, b) => {
    const scoreDiff = (b.engineeringScore as number) - (a.engineeringScore as number);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    return a.evaluation.developer.localeCompare(b.evaluation.developer);
  });

  const ranked: DeveloperProfile[] = [];
  let currentRank = 0;
  let previousScore: number | null = null;

  for (const profile of ordered) {
    const score = profile.engineeringScore as number;

    if (previousScore === null || score !== previousScore) {
      currentRank += 1;
      previousScore = score;
    }

    ranked.push({
      ...profile,
      rank: currentRank,
    });
  }

  return [...ranked, ...unscored];
}
```

## `src/services/developer-profile/status.ts`

```typescript
/**
 * Developer Profile status resolution.
 *
 * Milestone 8B derives status from Engineering Score bands in
 * {@link ENGINEERING_SCORE_CONFIG.statusThresholds}.
 * Recovery never influences status.
 */

import { ENGINEERING_SCORE_CONFIG } from "./config";
import type { DeveloperEvaluation, DeveloperProfileStatus } from "./types";

/**
 * Returns true when the developer has completed engineering work in scope.
 *
 * Signals (any one is sufficient for "has data"):
 * - Contribution completedTasks > 0
 * - Contribution deliveredEngineeringHours > 0
 * - Execution Efficiency resolved
 * - Delivery Quality resolved
 *
 * Recovery alone does not count as completed feature work.
 */
export function hasCompletedWork(evaluation: DeveloperEvaluation): boolean {
  const { contribution, execution, quality } = evaluation;

  if (contribution.completedTasks > 0) {
    return true;
  }

  if (contribution.deliveredEngineeringHours > 0) {
    return true;
  }

  if (execution.resolved) {
    return true;
  }

  if (quality.resolved) {
    return true;
  }

  return false;
}

/**
 * Maps an Engineering Score to a profile status band.
 *
 * Thresholds (from config):
 * | Score        | Status          |
 * |--------------|-----------------|
 * | ≥ 90         | Healthy         |
 * | 75 – 89.99   | Good            |
 * | 60 – 74.99   | Needs Attention |
 * | < 60         | Critical        |
 *
 * Pass `null` for No Data (no completed work / no available KPIs).
 */
export function resolveStatusFromScore(
  score: number | null
): DeveloperProfileStatus {
  if (score === null) {
    return "No Data";
  }

  const { healthy, good, needsAttention } =
    ENGINEERING_SCORE_CONFIG.statusThresholds;

  if (score >= healthy) {
    return "Healthy";
  }

  if (score >= good) {
    return "Good";
  }

  if (score >= needsAttention) {
    return "Needs Attention";
  }

  return "Critical";
}

/**
 * Resolves {@link DeveloperProfileStatus} for a developer evaluation.
 *
 * - "No Data" when the developer has no completed work
 * - Otherwise derived from Engineering Score via {@link resolveStatusFromScore}
 *
 * Prefer calling this with a pre-computed score from
 * {@link calculateEngineeringScore} to avoid duplicate calculation.
 * Recovery never influences status.
 */
export function resolveDeveloperProfileStatus(
  evaluation: DeveloperEvaluation,
  engineeringScore: number | null = null
): DeveloperProfileStatus {
  if (!hasCompletedWork(evaluation)) {
    return "No Data";
  }

  return resolveStatusFromScore(engineeringScore);
}
```

## `src/services/developer-profile/types.ts`

```typescript
/**
 * Developer Evaluation & Profile — type definitions.
 *
 * Milestone 8A aggregates task-evaluation engine outputs.
 * Milestone 8B attaches Engineering Score, status bands, and dense ranking.
 */

import type { ReportingPeriod } from "@/services/dashboard/types";
import type {
  ContributionResult,
  ExecutionEfficiencyResult,
  QualityResult,
  RecoveryResult,
} from "@/services/task-evaluation/task-evaluation";
import type { EngineeringScoreKpi } from "./config";

export type { ReportingPeriod };

/**
 * Profile health status for a developer in the reporting period.
 *
 * Derived from Engineering Score bands (Milestone 8B), except "No Data"
 * when the developer has no completed engineering work / no available KPIs.
 */
export type DeveloperProfileStatus =
  | "Healthy"
  | "Good"
  | "Needs Attention"
  | "Critical"
  | "No Data";

/**
 * Aggregation of all implemented task-evaluation engine results for one
 * developer in one reporting period.
 *
 * Engine outputs remain intact — they are never flattened into primitives.
 * Recovery is included for visibility and does not affect Engineering Score.
 */
export interface DeveloperEvaluation {
  /** Developer display name (Jira worklog author). */
  developer: string;
  /**
   * Technology from team mapping.
   * Empty string when technology mapping is missing.
   */
  technology: string;
  /** Reporting window for this evaluation. */
  reportingPeriod: ReportingPeriod;
  /** Execution Efficiency engine result (intact). */
  execution: ExecutionEfficiencyResult;
  /** Delivery Quality engine result (intact). */
  quality: QualityResult;
  /**
   * Recovery engine result (intact).
   * Informational only — never feeds Engineering Score.
   */
  recovery: RecoveryResult;
  /** Business Contribution engine result (intact). */
  contribution: ContributionResult;
}

/**
 * Per-KPI component scores that participated in Engineering Score.
 * Missing KPIs are omitted (never coerced to zero).
 */
export type EngineeringScoreComponents = Partial<
  Record<EngineeringScoreKpi, number>
>;

/**
 * Normalized weight map for the KPIs available on a developer.
 * Values sum to 1 when at least one KPI is available.
 */
export type NormalizedWeights = Partial<Record<EngineeringScoreKpi, number>>;

/** Output of the Engineering Score Engine. */
export interface EngineeringScoreResult {
  /**
   * Full-precision Engineering Score (0–100 scale).
   * Null when no implemented KPIs are available (No Data).
   */
  score: number | null;
  /** Component scores used (only available KPIs). */
  components: EngineeringScoreComponents;
  /** Dynamically normalized weights that summed to the score. */
  normalizedWeights: NormalizedWeights;
}

/**
 * Canonical developer object used throughout TeamPulse.
 *
 * Wraps {@link DeveloperEvaluation} with Engineering Score, status, and
 * optional dense rank (assigned by assignDenseRanks).
 */
export interface DeveloperProfile {
  evaluation: DeveloperEvaluation;
  status: DeveloperProfileStatus;
  /**
   * Full-precision Engineering Score (0–100).
   * Null when no implemented KPIs are available (No Data).
   */
  engineeringScore: number | null;
  /**
   * Explainable score breakdown (components + normalized weights).
   * Null when Engineering Score could not be calculated.
   */
  engineeringScoreDetail: EngineeringScoreResult | null;
  /**
   * Dense rank among peers (1 = highest score).
   * Null until assignDenseRanks runs, or when score is null.
   */
  rank: number | null;
}

/** Inputs required to assemble a {@link DeveloperEvaluation}. */
export interface BuildDeveloperEvaluationInput {
  developer: string;
  /**
   * Technology from team mapping.
   * Pass an empty string when mapping is missing — do not invent a value.
   */
  technology: string;
  reportingPeriod: ReportingPeriod;
  /** Intact Execution Efficiency result. */
  execution: ExecutionEfficiencyResult;
  /** Intact Delivery Quality result. */
  quality: QualityResult;
  /** Intact Recovery result. */
  recovery: RecoveryResult;
  /** Intact Business Contribution result. */
  contribution: ContributionResult;
}
```

## `src/services/developer-profile/build-developer-profile.ts`

```typescript
import { calculateEngineeringScore } from "./calculate-engineering-score";
import { buildDeveloperEvaluation } from "./build-developer-evaluation";
import { hasCompletedWork, resolveDeveloperProfileStatus } from "./status";
import type {
  BuildDeveloperEvaluationInput,
  DeveloperEvaluation,
  DeveloperProfile,
} from "./types";

/**
 * Builds the canonical {@link DeveloperProfile} for a developer.
 *
 * Pipeline:
 * 1. Assemble {@link DeveloperEvaluation} from intact engine results.
 * 2. Calculate Engineering Score (dynamic weight normalization).
 * 3. Resolve profile status from score bands (or "No Data").
 *
 * Developers with no completed work are still returned — they are never
 * filtered out. Their status is "No Data" and engineeringScore is null.
 *
 * Dense ranking is applied separately via {@link assignDenseRanks}.
 * Recovery remains visible on the evaluation and does not affect score.
 */
export function buildDeveloperProfile(
  input: BuildDeveloperEvaluationInput
): DeveloperProfile {
  const evaluation = buildDeveloperEvaluation(input);
  return wrapDeveloperEvaluation(evaluation);
}

/**
 * Wraps an existing {@link DeveloperEvaluation} into a {@link DeveloperProfile}.
 *
 * Calculates Engineering Score and status. Rank defaults to null until
 * {@link assignDenseRanks} is applied to a peer set.
 */
export function wrapDeveloperEvaluation(
  evaluation: DeveloperEvaluation
): DeveloperProfile {
  if (!hasCompletedWork(evaluation)) {
    return {
      evaluation,
      status: "No Data",
      engineeringScore: null,
      engineeringScoreDetail: null,
      rank: null,
    };
  }

  const detail = calculateEngineeringScore(evaluation);
  const engineeringScore = detail.score;

  return {
    evaluation,
    status: resolveDeveloperProfileStatus(evaluation, engineeringScore),
    engineeringScore,
    engineeringScoreDetail: engineeringScore === null ? null : detail,
    rank: null,
  };
}
```

## `src/services/developer-profile/build-developer-evaluation.ts`

```typescript
import type {
  BuildDeveloperEvaluationInput,
  DeveloperEvaluation,
} from "./types";

/**
 * Assembles a {@link DeveloperEvaluation} from intact engine results.
 *
 * Pure aggregation — does not invoke metric engines, recalculate scores,
 * or flatten result objects. Callers supply pre-computed engine outputs.
 *
 * Recovery is included for visibility and must never be omitted.
 */
export function buildDeveloperEvaluation(
  input: BuildDeveloperEvaluationInput
): DeveloperEvaluation {
  return {
    developer: input.developer,
    technology: input.technology,
    reportingPeriod: input.reportingPeriod,
    execution: input.execution,
    quality: input.quality,
    recovery: input.recovery,
    contribution: input.contribution,
  };
}
```

## `src/services/developer-profile/index.ts`

```typescript
/**
 * Developer Evaluation & Profile Engine — public module entry.
 *
 * Sprint 3B Milestone 8A aggregates task-evaluation engine outputs.
 * Sprint 3B Milestone 8B adds Engineering Score, status bands, and dense ranking.
 *
 * Does not modify dashboard services or existing metric engines.
 */

export { buildDeveloperEvaluation } from "./build-developer-evaluation";
export {
  buildDeveloperProfile,
  wrapDeveloperEvaluation,
} from "./build-developer-profile";
export {
  calculateContributionScore,
  calculateEngineeringScore,
  resolveAvailableKpis,
} from "./calculate-engineering-score";
export {
  ENGINEERING_SCORE_CONFIG,
} from "./config";
export { normalizeWeights } from "./normalize-weights";
export { assignDenseRanks } from "./ranking";
export {
  hasCompletedWork,
  resolveDeveloperProfileStatus,
  resolveStatusFromScore,
} from "./status";

export type {
  BuildDeveloperEvaluationInput,
  DeveloperEvaluation,
  DeveloperProfile,
  DeveloperProfileStatus,
  EngineeringScoreComponents,
  EngineeringScoreResult,
  NormalizedWeights,
  ReportingPeriod,
} from "./types";
export type {
  EngineeringScoreConfig,
  EngineeringScoreKpi,
  EngineeringScoreStatusThresholds,
  EngineeringScoreWeights,
  FutureEngineeringScoreKpi,
} from "./config";
```

# 9 Edge Cases

## Missing KPI

If Quality is unresolved, available KPIs = Execution + Contribution. Weights normalize over 25 + 20 = 45 (not 70). Quality is omitted — never scored as 0.

## No Data developer

No completed work → `wrapDeveloperEvaluation` returns `status: "No Data"`, `engineeringScore: null`, `rank: null`. Profile is still returned. `assignDenseRanks` appends these after scored peers.

## Equal scores

Dense ranking: 95, 95, 92 → ranks 1, 1, 2 (no gap). Name is used only as a stable sort tie-break when scores are equal; ranks remain shared.

## Zero contribution

`contribution.resolved === true` with `deliveredEngineeringHours === 0` → Contribution Score = 0. This is a valid KPI (not missing). Weight still participates.

## Contribution above expected capacity

160h expected; 200h delivered → Contribution Score = `min(200/160×100, 100)` = 100. Never exceeds 100.

# 10 Mathematical Validation

Raw weights: Execution 25, Quality 25, Contribution 20. Expected Engineering Capacity Hours = 160.

All three available → normalized = 25/70, 25/70, 20/70.

### Example 1 — Spec happy path

Execution = 95, Quality = 90, Contribution = 160h

Contribution Score = min(160/160×100, 100) = **100**

Engineering Score = 95×(25/70) + 90×(25/70) + 100×(20/70) = **94.642857…**

Status = **Healthy**

### Example 2 — Missing Quality

Execution = 80, Quality = missing, Contribution = 80h

Contribution Score = 80/160×100 = **50**

Normalized over 25+20=45: Exec 25/45, Contrib 20/45

Engineering Score = 80×(25/45) + 50×(20/45) = **66.666…**

Status = **Needs Attention**

### Example 3 — No Data

No completed work, all engines unresolved / zero contribution

Engineering Score = **null**

Status = **No Data**

Rank = **null**

### Example 4 — Contribution above capacity

Execution = 90, Quality = 90, Contribution = 200h

Contribution Score = min(200/160×100, 100) = **100**

Engineering Score = 90×(25/70) + 90×(25/70) + 100×(20/70) = **92.857…**

Status = **Healthy**

### Example 5 — Zero contribution (resolved)

Execution = 100, Quality = 100, Contribution = 0h

Contribution Score = **0**

Engineering Score = 100×(25/70) + 100×(25/70) + 0×(20/70) = **71.428…**

Status = **Needs Attention**

### Example 6 — Dense ranking ties

Scores: 95, 95, 92

Ranks: **1, 1, 2**

### Example 7 — Execution only

Execution = 70, Quality missing, Contribution missing

Normalized weight = 1.0

Engineering Score = **70**

Status = **Needs Attention**

### Example 8 — Critical band

Execution = 40, Quality = 40, Contribution = 32h → Contribution Score = 20

Engineering Score = 40×(25/70) + 40×(25/70) + 20×(20/70) = **34.285…**

Status = **Critical**

### Example 9 — Healthy boundary

Execution = 90, Quality = 90, Contribution = 144h → Contribution Score = 90

Engineering Score = 90×(25/70) + 90×(25/70) + 90×(20/70) = **90**

Status = **Healthy** (≥ 90)

### Example 10 — Good boundary

Execution = 75, Quality = 75, Contribution = 120h → Contribution Score = 75

Engineering Score = **75**

Status = **Good** (≥ 75 and < 90)

### Example 11 — Contribution only

Execution missing, Quality missing, Contribution = 160h

Contribution Score = **100**

Normalized weight = 1.0

Engineering Score = **100**

Status = **Healthy**

### Example 12 — Good upper band

Execution = 88, Quality = 82, Contribution = 160h → Contribution Score = 100

Engineering Score = 88×(25/70) + 82×(25/70) + 100×(20/70) = **89.285…**

Status = **Good**

# 11 Architecture Diagram

```
Task Evaluation Engines
    (Execution / Quality / Recovery / Contribution)
    ↓
Developer Evaluation
    (intact results + reporting period)
    ↓
Developer Profile
    ↓
Engineering Score
    (dynamic weights · Contribution Score · full precision)
    ↓
Status bands
    ↓
Dense Ranking
```

# 12 Build Output

```
> teampulse@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 6.1s
  Running TypeScript ...
  Finished TypeScript in 7.6s ...
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
✓ Generating static pages using 7 workers (15/15) in 16.4s
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

- Contribution availability uses `contribution.resolved`. The Contribution engine currently always returns `resolved: true`, so zero-hour contribution still participates as score 0 (intentional per “zero contribution” rule).
- Developer-level Execution/Quality aggregation (many tasks → one result) remains a caller responsibility; this module scores the supplied evaluation as-is.
- Ranking is a separate pass (`assignDenseRanks`); single-profile build leaves `rank: null`.

## Future improvements

- Add Compliance / Utilization / AI Insights to config weights when those engines ship.
- Extract `ReportingPeriod` from dashboard types into a shared module.
- Optional UI rounding helper (display only) once dashboards consume profiles.

## Technical debt

- Type-only import of `ReportingPeriod` from `@/services/dashboard/types` remains from 8A.
- `assignDenseRanks` uses `as number` after null filtering; could be narrowed with a typed scored-profile helper.
