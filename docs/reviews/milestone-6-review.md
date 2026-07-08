# Review Checklist

- [x] Architecture follows TeamPulse standards
- [x] Business rules match Engineering-Metrics-Specification.md
- [x] Pure functions only
- [x] Strong typing
- [x] Build passes
- [x] Documentation updated

# 1 Objective

Implement the **Recovery Engine** for Sprint 3B Milestone 6. This module measures engineering recovery effort spent fixing QA/UAT defects. It is informational only and does not modify Engineering Score, Execution Efficiency, Delivery Quality, Contribution, or dashboard services.

# 2 Architecture

The Recovery Engine lives under `src/services/task-evaluation/calculate-recovery/` as a modular set of pure functions, consistent with Milestones 4 (Execution Efficiency) and 5 (Delivery Quality).

```
calculate-recovery/
├── types.ts                  # RecoveryInput, RecoveryResult, supporting types
├── bug-worklog-sources.ts    # Bug classification, dedupe, worklog hour helpers
├── recovery-hours.ts         # Developer and scope-wide hour aggregation
├── recovery-percentage.ts    # Percentage formula and Low/Medium/High rating
├── calculate-recovery.ts     # Orchestrator — calculateRecovery()
└── index.ts                  # Public module exports
```

**Data flow:**

1. `collectRecoveryBugs()` filters `linkedBugs` to QA Bug / UAT Bug issues with at least one worklog, then dedupes by issue key (reopened bugs count once).
2. `calculateDeveloperRecoveryHours()` sums worklog hours attributed to the target developer (no proportional allocation).
3. `calculateTotalRecoveryHours()` sums all worklog hours on the same qualifying bug set (all developers).
4. `calculateRecoveryPercentage()` computes `(developerHours / totalHours) × 100`.
5. `resolveRecoveryRating()` maps percentage to Low / Medium / High.

The public API is re-exported from `src/services/task-evaluation/task-evaluation.ts` as `calculateRecovery` and associated types. It is **not** wired into `evaluateTask()` or dashboard aggregators in this milestone.

# 3 Business Rules Implemented

| Rule | Implementation |
|------|----------------|
| Recovery measures QA/UAT defect fix effort; informational only | Documented in `calculate-recovery.ts`; no score/penalty side effects |
| Only QA Bug and UAT Bug worklogs | `classifyRecoveryBugType()` returns null for other types |
| Attributed to developer who logged work; actual hours | `sumDeveloperBugRecoveryHours()` via `filterDeveloperWorklogs()` |
| Ignore bugs without worklogs | `collectRecoveryBugs()` requires `recoveryBugHasWorklogs()` |
| Reopened bugs count once; hours summed normally | `dedupeBugIssuesByKey()` before counts; all worklog entries on kept issue summed |
| Return Recovery Hours and Recovery Percentage | `RecoveryResult` + `calculateRecoveryPercentage()` |
| Return full `RecoveryResult` shape | All required fields including `rating` (Low / Medium / High) |

**Rating bands (Milestone 6 spec):**

| Percentage | Rating |
|------------|--------|
| < 10% | Low |
| 10% – 30% | Medium |
| > 30% | High |

# 4 Files Created

| File | Purpose |
|------|---------|
| `src/services/task-evaluation/calculate-recovery/types.ts` | Strongly typed input/output contracts |
| `src/services/task-evaluation/calculate-recovery/bug-worklog-sources.ts` | Bug filtering, dedupe, worklog hour helpers |
| `src/services/task-evaluation/calculate-recovery/recovery-hours.ts` | Developer and total recovery hour aggregation |
| `src/services/task-evaluation/calculate-recovery/recovery-percentage.ts` | Percentage and rating resolution |
| `src/services/task-evaluation/calculate-recovery/calculate-recovery.ts` | Main orchestrator |
| `src/services/task-evaluation/calculate-recovery/index.ts` | Module public exports |

# 5 Files Modified

| File | Change |
|------|--------|
| `src/services/task-evaluation/task-evaluation.ts` | Export `calculateRecovery` and Recovery types |

# 6 Files Deleted

None.

# 7 Public Interfaces

```typescript
// Primary entry point
function calculateRecovery(input: RecoveryInput): RecoveryResult;

interface RecoveryInput {
  developer: string;
  linkedBugs: JiraIssueInput[];
}

interface RecoveryResult {
  resolved: boolean;
  qaRecoveryHours: number;
  uatRecoveryHours: number;
  totalRecoveryHours: number;
  qaBugCount: number;
  uatBugCount: number;
  recoveryPercentage: number;
  rating: RecoveryRating; // "Low" | "Medium" | "High"
}

type RecoveryRating = "Low" | "Medium" | "High";
type RecoveryBugType = "QA Bug" | "UAT Bug";

// Supporting exports (module index)
function classifyRecoveryBugType(issue: JiraIssueInput): RecoveryBugType | null;
function collectRecoveryBugs(linkedBugs: JiraIssueInput[]): JiraIssueInput[];
function dedupeBugIssuesByKey(bugs: JiraIssueInput[]): JiraIssueInput[];
function recoveryBugHasWorklogs(issue: JiraIssueInput): boolean;
function sumBugRecoveryHours(issue: JiraIssueInput): number;
function sumDeveloperBugRecoveryHours(issue: JiraIssueInput, developer: string): number;
function calculateDeveloperRecoveryHours(linkedBugs: JiraIssueInput[], developer: string): RecoveryHoursBreakdown;
function calculateTotalRecoveryHours(linkedBugs: JiraIssueInput[]): number;
function calculateRecoveryPercentage(developerRecoveryHours: number, totalRecoveryHours: number): number;
function resolveRecoveryRating(recoveryPercentage: number): RecoveryRating;
const RECOVERY_RATING_THRESHOLDS: { readonly LOW_MAX: 10; readonly MEDIUM_MAX: 30 };
```

# 8 Complete Source Code

## `src/services/task-evaluation/calculate-recovery/types.ts`

```typescript
import type { JiraIssueInput } from "../types";

export type RecoveryBugType = "QA Bug" | "UAT Bug";

export type RecoveryRating = "Low" | "Medium" | "High";

/** Inputs for recovery effort calculation. */
export interface RecoveryInput {
  /** Developer whose recovery worklogs are measured. */
  developer: string;
  /** QA / UAT bug issues in the evaluation scope. */
  linkedBugs: JiraIssueInput[];
}

/** Aggregated recovery hours for a developer. */
export interface RecoveryHoursBreakdown {
  qaRecoveryHours: number;
  uatRecoveryHours: number;
  totalRecoveryHours: number;
  qaBugCount: number;
  uatBugCount: number;
}

/** Output of the Recovery Engine. */
export interface RecoveryResult {
  resolved: boolean;
  qaRecoveryHours: number;
  uatRecoveryHours: number;
  totalRecoveryHours: number;
  qaBugCount: number;
  uatBugCount: number;
  recoveryPercentage: number;
  rating: RecoveryRating;
}
```

## `src/services/task-evaluation/calculate-recovery/bug-worklog-sources.ts`

```typescript
import { readIssueType } from "../resolve-estimate";
import {
  filterDeveloperWorklogs,
  readRawWorklogs,
  secondsToDecimalHours,
  sumWorklogHours,
} from "../parse-worklogs";
import type { JiraIssueInput } from "../types";
import type { RecoveryBugType } from "./types";

/**
 * Classifies an issue as QA Bug or UAT Bug.
 *
 * Returns null for all other issue types.
 */
export function classifyRecoveryBugType(
  issue: JiraIssueInput
): RecoveryBugType | null {
  const issueType = readIssueType(issue);

  if (issueType === "QA Bug" || issueType === "UAT Bug") {
    return issueType;
  }

  return null;
}

/**
 * Returns true when a bug issue contains at least one worklog entry.
 */
export function recoveryBugHasWorklogs(issue: JiraIssueInput): boolean {
  return readRawWorklogs(issue).length > 0;
}

/**
 * Deduplicates bug issues by issue key so reopened bugs count once.
 */
export function dedupeBugIssuesByKey(
  bugs: JiraIssueInput[]
): JiraIssueInput[] {
  const seen = new Set<string>();

  return bugs.filter((issue) => {
    const key = issue.key ?? "";
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Collects QA / UAT bugs that contain worklogs.
 *
 * Non-bug issue types and bugs without worklogs are ignored.
 */
export function collectRecoveryBugs(
  linkedBugs: JiraIssueInput[]
): JiraIssueInput[] {
  const qualifying = linkedBugs.filter((issue) => {
    return (
      classifyRecoveryBugType(issue) !== null &&
      recoveryBugHasWorklogs(issue)
    );
  });

  return dedupeBugIssuesByKey(qualifying);
}

/**
 * Sums all recovery worklog hours on a bug issue (all developers).
 */
export function sumBugRecoveryHours(issue: JiraIssueInput): number {
  return readRawWorklogs(issue).reduce(
    (total, entry) => total + secondsToDecimalHours(entry.timeSpentSeconds ?? 0),
    0
  );
}

/**
 * Sums a developer's recovery worklog hours on a single bug issue.
 */
export function sumDeveloperBugRecoveryHours(
  issue: JiraIssueInput,
  developer: string
): number {
  return sumWorklogHours(
    filterDeveloperWorklogs(readRawWorklogs(issue), developer)
  );
}
```

## `src/services/task-evaluation/calculate-recovery/recovery-hours.ts`

```typescript
import {
  classifyRecoveryBugType,
  collectRecoveryBugs,
  sumDeveloperBugRecoveryHours,
  sumBugRecoveryHours,
} from "./bug-worklog-sources";
import type { JiraIssueInput } from "../types";
import type { RecoveryHoursBreakdown } from "./types";

/**
 * Calculates recovery hours for a developer across QA / UAT bugs.
 *
 * Work is attributed to the developer who logged the worklog.
 * No proportional allocation is applied.
 */
export function calculateDeveloperRecoveryHours(
  linkedBugs: JiraIssueInput[],
  developer: string
): RecoveryHoursBreakdown {
  const bugs = collectRecoveryBugs(linkedBugs);

  let qaRecoveryHours = 0;
  let uatRecoveryHours = 0;
  let qaBugCount = 0;
  let uatBugCount = 0;

  for (const bug of bugs) {
    const bugType = classifyRecoveryBugType(bug);
    if (!bugType) {
      continue;
    }

    const developerHours = sumDeveloperBugRecoveryHours(bug, developer);

    if (bugType === "QA Bug") {
      qaBugCount += 1;
      qaRecoveryHours += developerHours;
    } else {
      uatBugCount += 1;
      uatRecoveryHours += developerHours;
    }
  }

  return {
    qaRecoveryHours,
    uatRecoveryHours,
    totalRecoveryHours: qaRecoveryHours + uatRecoveryHours,
    qaBugCount,
    uatBugCount,
  };
}

/**
 * Calculates total recovery hours logged on QA / UAT bugs by all developers.
 */
export function calculateTotalRecoveryHours(
  linkedBugs: JiraIssueInput[]
): number {
  const bugs = collectRecoveryBugs(linkedBugs);

  return bugs.reduce(
    (total, bug) => total + sumBugRecoveryHours(bug),
    0
  );
}
```

## `src/services/task-evaluation/calculate-recovery/recovery-percentage.ts`

```typescript
import type { RecoveryRating } from "./types";

/** Recovery percentage thresholds for Low / Medium / High ratings. */
export const RECOVERY_RATING_THRESHOLDS = {
  LOW_MAX: 10,
  MEDIUM_MAX: 30,
} as const;

/**
 * Calculates recovery percentage for a developer.
 *
 * Formula:
 *   (developerRecoveryHours / totalRecoveryHours) × 100
 *
 * Returns 0 when totalRecoveryHours is zero.
 */
export function calculateRecoveryPercentage(
  developerRecoveryHours: number,
  totalRecoveryHours: number
): number {
  if (totalRecoveryHours <= 0) {
    return 0;
  }

  return (developerRecoveryHours / totalRecoveryHours) * 100;
}

/**
 * Maps recovery percentage to an informational rating band.
 *
 * | Percentage | Rating |
 * |------------|--------|
 * | < 10%      | Low    |
 * | 10% – 30%  | Medium |
 * | > 30%      | High   |
 */
export function resolveRecoveryRating(
  recoveryPercentage: number
): RecoveryRating {
  if (recoveryPercentage < RECOVERY_RATING_THRESHOLDS.LOW_MAX) {
    return "Low";
  }

  if (recoveryPercentage <= RECOVERY_RATING_THRESHOLDS.MEDIUM_MAX) {
    return "Medium";
  }

  return "High";
}
```

## `src/services/task-evaluation/calculate-recovery/calculate-recovery.ts`

```typescript
import {
  calculateDeveloperRecoveryHours,
  calculateTotalRecoveryHours,
} from "./recovery-hours";
import {
  calculateRecoveryPercentage,
  resolveRecoveryRating,
} from "./recovery-percentage";
import type { RecoveryInput, RecoveryResult } from "./types";

/**
 * Recovery Engine
 * ===============
 *
 * Measures engineering effort spent fixing QA / UAT defects.
 *
 * This is an informational metric — it does not reduce Engineering Score,
 * Execution Efficiency, Delivery Quality, or Contribution.
 *
 * Pipeline:
 * 1. Collect QA / UAT bugs with worklogs (reopened bugs deduped for counts).
 * 2. Sum developer worklog hours directly (no proportional allocation).
 * 3. Sum total recovery hours across all developers on the same bug set.
 * 4. recoveryPercentage = developerHours / totalHours × 100
 * 5. Map percentage to Low / Medium / High rating.
 */
export function calculateRecovery(input: RecoveryInput): RecoveryResult {
  const { developer, linkedBugs } = input;

  const developerRecovery = calculateDeveloperRecoveryHours(
    linkedBugs,
    developer
  );
  const scopeTotalRecoveryHours = calculateTotalRecoveryHours(linkedBugs);

  const recoveryPercentage = calculateRecoveryPercentage(
    developerRecovery.totalRecoveryHours,
    scopeTotalRecoveryHours
  );

  return {
    resolved: true,
    qaRecoveryHours: developerRecovery.qaRecoveryHours,
    uatRecoveryHours: developerRecovery.uatRecoveryHours,
    totalRecoveryHours: developerRecovery.totalRecoveryHours,
    qaBugCount: developerRecovery.qaBugCount,
    uatBugCount: developerRecovery.uatBugCount,
    recoveryPercentage,
    rating: resolveRecoveryRating(recoveryPercentage),
  };
}
```

## `src/services/task-evaluation/calculate-recovery/index.ts`

```typescript
/**
 * Recovery Engine — public module entry.
 */

export { calculateRecovery } from "./calculate-recovery";
export {
  classifyRecoveryBugType,
  collectRecoveryBugs,
  dedupeBugIssuesByKey,
  recoveryBugHasWorklogs,
  sumBugRecoveryHours,
  sumDeveloperBugRecoveryHours,
} from "./bug-worklog-sources";
export {
  calculateDeveloperRecoveryHours,
  calculateTotalRecoveryHours,
} from "./recovery-hours";
export {
  calculateRecoveryPercentage,
  RECOVERY_RATING_THRESHOLDS,
  resolveRecoveryRating,
} from "./recovery-percentage";

export type {
  RecoveryBugType,
  RecoveryHoursBreakdown,
  RecoveryInput,
  RecoveryRating,
  RecoveryResult,
} from "./types";
```

## `src/services/task-evaluation/task-evaluation.ts`

```typescript
/**
 * Task Evaluation Engine — public module entry.
 *
 * Milestone 1 exposes factual task evaluation orchestration only.
 * Calculation modules are stubbed for future milestones.
 */

export { calculateContribution } from "./calculate-contribution";
export { calculateEfficiency, calculateEfficiencyForIssue } from "./calculate-efficiency";
export { resolveAllocationDenominatorHours } from "./allocation-context";
export {
  calculateQuality,
  getBaseQualityScore,
} from "./calculate-quality";
export { calculateRecovery } from "./calculate-recovery";
export { evaluateTask } from "./evaluate-task";
export { resolveEstimate } from "./resolve-estimate";
export { resolveWorklogs } from "./resolve-worklogs";

export type {
  RecoveryBugType,
  RecoveryHoursBreakdown,
  RecoveryInput,
  RecoveryRating,
  RecoveryResult,
} from "./calculate-recovery";
export type {
  BugType,
  QualityBugRecord,
  QualityInput,
  QualityRating,
  QualityReason,
  QualityResult,
} from "./calculate-quality";
export type {
  EfficiencyRating,
  EstimateSource,
  EvaluateTaskOptions,
  ExecutionEfficiencyInput,
  ExecutionEfficiencyReason,
  ExecutionEfficiencyResult,
  JiraIssueInput,
  ResolvedEstimate,
  ResolvedWorklogs,
  TaskEvaluation,
  TaskWorklog,
} from "./types";
```

# 9 Edge Cases

| Scenario | Behavior |
|----------|----------|
| Empty `linkedBugs` | All hours and counts are 0; `recoveryPercentage` is 0; `rating` is Low; `resolved` is true |
| No QA/UAT bugs in scope | Same as empty qualifying set |
| QA/UAT bugs with zero worklogs | Ignored by `collectRecoveryBugs()` |
| Non-bug issue types (Story, Task, etc.) | Ignored by `classifyRecoveryBugType()` |
| Developer has no worklogs on qualifying bugs | Developer hours are 0; bug counts still increment for bugs in scope; percentage is 0 if total > 0 |
| Duplicate issue keys (reopened bugs) | First occurrence kept; counts once; worklogs summed from kept issue only |
| Duplicate keys with split worklogs across entries | Only first entry's worklogs contribute (input normalization assumed upstream) |
| `totalRecoveryHours` is 0 | `recoveryPercentage` returns 0 (guard in `calculateRecoveryPercentage`) |
| Boundary at 10% | Rating is Medium (`< 10` is false, `<= 30` is true) |
| Boundary at 30% | Rating is Medium |
| Just above 30% | Rating is High |
| Missing issue key | Issue excluded from deduped set (`!key` filter) |

# 10 Mathematical Logic

**Developer recovery hours (per bug type):**

```
qaRecoveryHours = Σ sumDeveloperBugRecoveryHours(bug, developer)  for bug ∈ QA Bugs
uatRecoveryHours = Σ sumDeveloperBugRecoveryHours(bug, developer)  for bug ∈ UAT Bugs
totalRecoveryHours = qaRecoveryHours + uatRecoveryHours
```

**Scope total recovery hours (denominator):**

```
scopeTotal = Σ sumBugRecoveryHours(bug)  for bug ∈ collectRecoveryBugs(linkedBugs)
```

where `sumBugRecoveryHours` includes all developers' worklogs on each qualifying bug.

**Recovery percentage:**

```
recoveryPercentage = (developer.totalRecoveryHours / scopeTotal) × 100
```

Returns `0` when `scopeTotal <= 0`.

**Rating:**

```
if recoveryPercentage < 10  → Low
else if recoveryPercentage <= 30 → Medium
else → High
```

**Bug counts:** One increment per deduped qualifying bug key, regardless of how many worklog entries exist on that bug.

# 11 Build Output

```
> teampulse@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 6.3s
  Running TypeScript ...
  Finished TypeScript in 5.9s ...
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
✓ Generating static pages using 7 workers (15/15) in 17.8s
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

npm notice
npm notice New major version of npm available! 10.9.2 -> 11.18.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.18.0
npm notice To update run: npm install -g npm@11.18.0
npm notice
```

Exit code: **0** (success).

# 12 Self Review

**Implementation rating: 8 / 10**

**Strengths:**

- Modular structure mirrors Delivery Quality and Execution Efficiency patterns.
- Reuses existing worklog parsing (`parse-worklogs.ts`) and issue type reading (`resolve-estimate.ts`).
- All business rules from Milestone 6 are encoded as pure, testable functions with JSDoc.
- No dashboard or orchestrator changes; scope boundary respected.
- Build passes with no TypeScript errors.

**Known limitations:**

- `resolved` is always `true`; no unresolved reason codes (unlike Delivery Quality). Acceptable for M6 scope but may need parity if upstream validation is added later.
- Duplicate issue keys with fragmented worklog data across duplicate objects would under-count hours (first wins). Assumes normalized Jira input.
- Rating bands (Low / Medium / High) differ from `Engineering-Scoring-Engine.md` Section 13 labels (Excellent / Healthy / Needs Attention / Critical) and use a scope-local denominator (developer share of recovery hours) rather than share of total engineering hours. This matches the Milestone 6 sprint spec, not the org-wide KPI formula in the scoring doc.

**Future improvements:**

- Unit tests for percentage boundaries, dedupe behavior, and multi-developer attribution.
- Wire into `evaluateTask()` when orchestration milestone requires it.
- Align org-wide Recovery Effort KPI (total engineering hours denominator) in dashboard layer when that sprint begins.
- Add `RecoveryReason` enum if guard conditions are introduced (e.g. missing developer mapping).

**Technical debt:**

- Minor duplication between `calculate-quality/bug-sources.ts` and `calculate-recovery/bug-worklog-sources.ts` for bug classification and dedupe. Could be shared in a future refactor without changing Milestone 6 scope.
