# Review Checklist

- [x] Architecture follows TeamPulse standards
- [x] Business rules match Engineering-Metrics-Specification.md
- [x] Pure functions only
- [x] Strong typing
- [x] Build passes
- [x] Documentation updated

# 1 Objective

Implement the **Business Contribution Engine** for Sprint 3B Milestone 7. This module measures planned engineering value delivered to the business using **allocated estimates only**. It is informational within the task-evaluation layer and does not modify Engineering Score, Execution Efficiency, Delivery Quality, Recovery, or dashboard services.

# 2 Architecture

The Business Contribution Engine lives under `src/services/task-evaluation/calculate-contribution/` as a modular set of pure functions, consistent with Milestones 4–6.

```
calculate-contribution/
├── types.ts                    # ContributionInput, ContributionResult
├── contribution-sources.ts     # Eligibility filtering (status, issue type)
├── contribution-allocation.ts  # Estimate resolution and proportional allocation
├── contribution-percentage.ts  # Percentage formula
├── calculate-contribution.ts   # Orchestrator — calculateContribution()
└── index.ts                    # Public module exports
```

**Data flow:**

1. `collectContributionIssues()` filters to development-complete feature work (Magento, React JS, HTML, DT, CR, RE); QA/UAT bugs excluded.
2. `resolveEstimate()` resolves Original Estimate (standard) or Technology Estimate (CR/RE).
3. `allocateContributionHours()` allocates estimate proportionally via developer worklog share (reuses `allocateEstimateHours` + `resolveAllocationDenominatorHours`).
4. `calculateDeveloperDeliveredHours()` sums developer allocations and counts `completedTasks`.
5. `calculateTotalDeliveredHours()` sums full resolved estimates for allocatable issues in scope.
6. `calculateContributionPercentage()` computes `(developerHours / totalHours) × 100`.

The stub `calculate-contribution.ts` at the task-evaluation root was replaced by the folder module. Public API re-exported from `task-evaluation.ts`. Not wired into `evaluateTask()` or dashboard aggregators.

# 3 Business Rules Implemented

| Rule | Implementation |
|------|----------------|
| Contribution uses allocated estimates, not actual worklog hours | `allocateContributionHours()` — worklogs used only for proportional share |
| Only completed engineering work | `isDevelopmentComplete()` via `DEVELOPMENT_COMPLETE_STATUSES` |
| No technology multipliers | 1 allocated hour = 1 contribution hour |
| QA/UAT bugs never contribute | `isBugWork()` exclusion in `isContributionEligible()` |
| Standard work → Original Estimate | `resolveEstimate()` for Magento/React/HTML/DT |
| CR/RE → Technology Estimate | `resolveEstimate()` with developer technology mapping |
| Shared work → proportional allocation | `allocateEstimateHours()` with worklog distribution denominator |
| Return `ContributionResult` | `resolved`, `deliveredEngineeringHours`, `contributionPercentage`, `completedTasks` |
| Contribution Percentage formula | `calculateContributionPercentage()` |

**Completed statuses (from `status-mapping.ts`):**

- Merge in UAT
- Ready for UAT
- Ready for Live
- Live
- Done

# 4 Files Created

| File | Purpose |
|------|---------|
| `src/services/task-evaluation/calculate-contribution/types.ts` | Input/output type contracts |
| `src/services/task-evaluation/calculate-contribution/contribution-sources.ts` | Eligibility and issue collection |
| `src/services/task-evaluation/calculate-contribution/contribution-allocation.ts` | Estimate allocation helpers |
| `src/services/task-evaluation/calculate-contribution/contribution-percentage.ts` | Percentage calculation |
| `src/services/task-evaluation/calculate-contribution/calculate-contribution.ts` | Main orchestrator |
| `src/services/task-evaluation/calculate-contribution/index.ts` | Module public exports |

# 5 Files Modified

| File | Change |
|------|--------|
| `src/services/task-evaluation/task-evaluation.ts` | Export `calculateContribution` and supporting helpers/types |

# 6 Files Deleted

| File | Reason |
|------|--------|
| `src/services/task-evaluation/calculate-contribution.ts` | Replaced by modular `calculate-contribution/` folder |

# 7 Public Interfaces

```typescript
// Primary entry point
function calculateContribution(input: ContributionInput): ContributionResult;

interface ContributionInput {
  developer: string;
  issues: JiraIssueInput[];
}

interface ContributionResult {
  resolved: boolean;
  deliveredEngineeringHours: number;
  contributionPercentage: number;
  completedTasks: number;
}

// Supporting exports (module index)
function collectContributionIssues(issues: JiraIssueInput[]): JiraIssueInput[];
function isContributionEligible(issue: JiraIssueInput): boolean;
function isContributionIssueType(issueType: string): boolean;
function readIssueStatus(issue: JiraIssueInput): string;
function allocateContributionHours(issue: JiraIssueInput, developer: string): number;
function resolveIssueDeliveredTotal(issue: JiraIssueInput): number;
function resolveIssueEstimateForTotal(issue: JiraIssueInput): ResolvedEstimate;
function readFirstWorklogDeveloper(issue: JiraIssueInput): string | null;
function calculateDeveloperDeliveredHours(issues: JiraIssueInput[], developer: string): { deliveredEngineeringHours: number; completedTasks: number };
function calculateTotalDeliveredHours(issues: JiraIssueInput[]): number;
function calculateContributionPercentage(developerDeliveredHours: number, totalDeliveredHours: number): number;
```

# 8 Complete Source Code

## `src/services/task-evaluation/calculate-contribution/types.ts`

```typescript
import type { JiraIssueInput } from "../types";

/** Inputs for business contribution calculation. */
export interface ContributionInput {
  /** Developer whose delivered engineering value is measured. */
  developer: string;
  /** Engineering issues in the evaluation scope. */
  issues: JiraIssueInput[];
}

/** Output of the Business Contribution Engine. */
export interface ContributionResult {
  /** True when contribution was calculated for the scope. */
  resolved: boolean;
  /** Developer's allocated delivered engineering hours. */
  deliveredEngineeringHours: number;
  /** Share of total delivered engineering hours in scope (0–100). */
  contributionPercentage: number;
  /** Completed feature tasks where the developer received allocated contribution. */
  completedTasks: number;
}
```

## `src/services/task-evaluation/calculate-contribution/contribution-sources.ts`

```typescript
import { isBugWork, isFeatureWork } from "@/config/issue-types";
import { isDevelopmentComplete } from "@/config/status-mapping";

import { readIssueType } from "../resolve-estimate";
import type { JiraIssueInput } from "../types";

/**
 * Reads the Jira workflow status name from an issue payload.
 */
export function readIssueStatus(issue: JiraIssueInput): string {
  const status = issue.fields?.status as { name?: string } | undefined;
  return status?.name ?? "";
}

/**
 * Returns true when the issue type is planned feature engineering work.
 */
export function isContributionIssueType(issueType: string): boolean {
  return isFeatureWork(issueType);
}

/**
 * Returns true when an issue qualifies for business contribution.
 *
 * Requirements:
 * - Development complete status
 * - Planned feature work (Magento, React JS, HTML, DT, CR, RE)
 * - Not QA Bug or UAT Bug
 */
export function isContributionEligible(issue: JiraIssueInput): boolean {
  const issueType = readIssueType(issue);

  if (isBugWork(issueType)) {
    return false;
  }

  if (!isContributionIssueType(issueType)) {
    return false;
  }

  return isDevelopmentComplete(readIssueStatus(issue));
}

/**
 * Collects completed feature engineering issues that participate in contribution.
 *
 * QA / UAT bugs and incomplete work are excluded.
 */
export function collectContributionIssues(
  issues: JiraIssueInput[]
): JiraIssueInput[] {
  return issues.filter(isContributionEligible);
}
```

## `src/services/task-evaluation/calculate-contribution/contribution-allocation.ts`

```typescript
import { resolveAllocationDenominatorHours } from "../allocation-context";
import { allocateEstimateHours } from "../allocate-estimate";
import { readRawWorklogs } from "../parse-worklogs";
import { resolveEstimate } from "../resolve-estimate";
import { resolveWorklogs } from "../resolve-worklogs";
import { collectWorklogSources } from "../worklog-sources";
import type { JiraIssueInput, ResolvedEstimate } from "../types";

/**
 * Reads the first developer displayName found on engineering worklogs.
 *
 * Used to resolve CR / RE technology estimates for scope-wide totals.
 */
export function readFirstWorklogDeveloper(
  issue: JiraIssueInput
): string | null {
  const sources = collectWorklogSources(issue);

  for (const source of sources) {
    for (const entry of readRawWorklogs(source)) {
      const developer = entry.author?.displayName;
      if (developer) {
        return developer;
      }
    }
  }

  return null;
}

/**
 * Resolves the full issue estimate used for scope-wide delivered totals.
 *
 * Standard feature work uses Original Estimate.
 * CR / RE work uses the technology estimate resolved from the first worklog author.
 */
export function resolveIssueEstimateForTotal(
  issue: JiraIssueInput
): ResolvedEstimate {
  const referenceDeveloper = readFirstWorklogDeveloper(issue) ?? "";
  return resolveEstimate(issue, referenceDeveloper);
}

/**
 * Allocates contribution hours to a developer on a single issue.
 *
 * Uses allocated engineering estimates — actual worklog hours are used only
 * to determine proportional share, never as delivered value directly.
 *
 * Standard work:
 *   allocated = originalEstimate × (developerHours / totalSubtaskHours)
 *
 * CR / RE work:
 *   allocated = technologyEstimate × (developerHours / totalTechnologyHours)
 */
export function allocateContributionHours(
  issue: JiraIssueInput,
  developer: string
): number {
  const estimate = resolveEstimate(issue, developer);

  if (!estimate.resolved) {
    return 0;
  }

  const worklogs = resolveWorklogs(issue, developer);

  if (!worklogs.resolved) {
    return 0;
  }

  const denominatorHours = resolveAllocationDenominatorHours(issue, estimate);
  const allocated = allocateEstimateHours({
    estimateHours: estimate.hours,
    developerHours: worklogs.actualHours,
    denominatorHours,
  });

  return allocated ?? 0;
}

/**
 * Resolves total delivered engineering hours for a single completed issue.
 *
 * When allocation is valid, proportional shares sum to the full resolved estimate.
 */
export function resolveIssueDeliveredTotal(issue: JiraIssueInput): number {
  const estimate = resolveIssueEstimateForTotal(issue);

  if (!estimate.resolved) {
    return 0;
  }

  const denominatorHours = resolveAllocationDenominatorHours(issue, estimate);

  if (denominatorHours <= 0) {
    return 0;
  }

  return estimate.hours;
}
```

## `src/services/task-evaluation/calculate-contribution/contribution-percentage.ts`

```typescript
/**
 * Calculates contribution percentage for a developer.
 *
 * Formula:
 *   (developerDeliveredHours / totalDeliveredHours) × 100
 *
 * Returns 0 when totalDeliveredHours is zero.
 */
export function calculateContributionPercentage(
  developerDeliveredHours: number,
  totalDeliveredHours: number
): number {
  if (totalDeliveredHours <= 0) {
    return 0;
  }

  return (developerDeliveredHours / totalDeliveredHours) * 100;
}
```

## `src/services/task-evaluation/calculate-contribution/calculate-contribution.ts`

```typescript
import {
  allocateContributionHours,
  resolveIssueDeliveredTotal,
} from "./contribution-allocation";
import { collectContributionIssues } from "./contribution-sources";
import { calculateContributionPercentage } from "./contribution-percentage";
import type { ContributionInput, ContributionResult } from "./types";

/**
 * Sums a developer's allocated delivered engineering hours across qualifying issues.
 */
export function calculateDeveloperDeliveredHours(
  issues: ContributionInput["issues"],
  developer: string
): { deliveredEngineeringHours: number; completedTasks: number } {
  const qualifyingIssues = collectContributionIssues(issues);

  let deliveredEngineeringHours = 0;
  let completedTasks = 0;

  for (const issue of qualifyingIssues) {
    const allocatedHours = allocateContributionHours(issue, developer);

    if (allocatedHours > 0) {
      deliveredEngineeringHours += allocatedHours;
      completedTasks += 1;
    }
  }

  return { deliveredEngineeringHours, completedTasks };
}

/**
 * Sums total delivered engineering hours across all qualifying issues in scope.
 */
export function calculateTotalDeliveredHours(
  issues: ContributionInput["issues"]
): number {
  const qualifyingIssues = collectContributionIssues(issues);

  return qualifyingIssues.reduce(
    (total, issue) => total + resolveIssueDeliveredTotal(issue),
    0
  );
}

/**
 * Business Contribution Engine
 * ============================
 *
 * Measures planned engineering value delivered to the business.
 *
 * This is an informational metric — it does not reduce Engineering Score,
 * Execution Efficiency, Delivery Quality, or Recovery.
 *
 * Pipeline:
 * 1. Collect completed feature engineering issues (exclude QA / UAT bugs).
 * 2. Resolve estimates (Original Estimate or Technology Estimate for CR / RE).
 * 3. Allocate contribution proportionally by developer worklog distribution.
 * 4. contributionPercentage = developerHours / totalHours × 100
 *
 * Actual worklog hours are never used as delivered value — only allocated estimates.
 */
export function calculateContribution(
  input: ContributionInput
): ContributionResult {
  const { developer, issues } = input;

  const { deliveredEngineeringHours, completedTasks } =
    calculateDeveloperDeliveredHours(issues, developer);
  const totalDeliveredHours = calculateTotalDeliveredHours(issues);

  const contributionPercentage = calculateContributionPercentage(
    deliveredEngineeringHours,
    totalDeliveredHours
  );

  return {
    resolved: true,
    deliveredEngineeringHours,
    contributionPercentage,
    completedTasks,
  };
}
```

## `src/services/task-evaluation/calculate-contribution/index.ts`

```typescript
/**
 * Business Contribution Engine — public module entry.
 */

export {
  calculateContribution,
  calculateDeveloperDeliveredHours,
  calculateTotalDeliveredHours,
} from "./calculate-contribution";
export {
  allocateContributionHours,
  readFirstWorklogDeveloper,
  resolveIssueDeliveredTotal,
  resolveIssueEstimateForTotal,
} from "./contribution-allocation";
export {
  collectContributionIssues,
  isContributionEligible,
  isContributionIssueType,
  readIssueStatus,
} from "./contribution-sources";
export { calculateContributionPercentage } from "./contribution-percentage";

export type { ContributionInput, ContributionResult } from "./types";
```

## `src/services/task-evaluation/task-evaluation.ts`

```typescript
/**
 * Task Evaluation Engine — public module entry.
 *
 * Milestone 1 exposes factual task evaluation orchestration only.
 * Calculation modules are stubbed for future milestones.
 */

export {
  calculateContribution,
  calculateContributionPercentage,
  calculateDeveloperDeliveredHours,
  calculateTotalDeliveredHours,
} from "./calculate-contribution";
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
  ContributionInput,
  ContributionResult,
} from "./calculate-contribution";
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
| Empty `issues` array | All values 0; `resolved` is true; `contributionPercentage` is 0 |
| No development-complete issues | Same as empty qualifying set |
| QA/UAT bug issues | Excluded entirely |
| Incomplete status (e.g. In Progress) | Excluded |
| Non-feature types (QA Task, unsupported) | Excluded via `isFeatureWork()` |
| Completed issue with missing estimate | 0 contribution; not counted in `completedTasks` for developer |
| Completed issue with estimate but no worklogs | 0 developer allocation; issue total is 0 (denominator = 0) |
| Developer with no worklogs on completed issue | 0 allocated hours; issue not counted in `completedTasks` |
| Solo developer on issue | Receives full resolved estimate as contribution |
| Shared issue (multiple developers) | Each receives proportional share; issue total equals full estimate |
| CR/RE with unknown developer technology | `resolveEstimate` unresolved → 0 contribution |
| CR/RE scope total without worklogs | `readFirstWorklogDeveloper` returns null → estimate unresolved → 0 total |
| `totalDeliveredHours` is 0 | `contributionPercentage` returns 0 |

# 10 Mathematical Logic

**Per-issue developer allocation (standard work):**

```
allocatedDeveloperHours = originalEstimate × (developerWorklogHours / totalSubtaskWorklogHours)
```

**Per-issue developer allocation (CR / RE):**

```
allocatedDeveloperHours = technologyEstimate × (developerTechnologyHours / totalTechnologyWorklogHours)
```

**Developer delivered engineering hours:**

```
deliveredEngineeringHours = Σ allocatedDeveloperHours  for issue ∈ qualifyingIssues where allocated > 0
```

**Scope total delivered engineering hours:**

```
totalDeliveredHours = Σ estimate.hours  for issue ∈ qualifyingIssues where estimate.resolved ∧ denominator > 0
```

When allocation is valid, `Σ allocatedDeveloperHours` across all developers on an issue equals `estimate.hours`.

**Contribution percentage:**

```
contributionPercentage = (deliveredEngineeringHours / totalDeliveredHours) × 100
```

Returns `0` when `totalDeliveredHours <= 0`.

**Completed tasks:**

```
completedTasks = count(issue ∈ qualifyingIssues where allocatedDeveloperHours > 0)
```

# 11 Build Output

```
> teampulse@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 7.5s
  Running TypeScript ...
  Finished TypeScript in 6.2s ...
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
✓ Generating static pages using 7 workers (15/15) in 18.0s
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
npm notice New major version of npm available! 10.9.2 -> 12.0.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v12.0.0
npm notice To update run: npm install -g npm@12.0.0
npm notice
```

Exit code: **0** (success).

# 12 Self Review

**Implementation rating: 8 / 10**

**Strengths:**

- Modular structure mirrors Recovery and Delivery Quality engines.
- Reuses existing estimate resolution, allocation, and worklog infrastructure — no duplicated math.
- All Milestone 7 business rules encoded as pure, testable functions with JSDoc.
- Scope boundaries respected: no dashboard, orchestrator, or other metric engine changes.
- Build passes with no TypeScript errors.

**Known limitations:**

- `resolved` is always `true`; no unresolved reason codes (unlike Delivery Quality).
- CR/RE scope totals use the first worklog author's technology to resolve the estimate; multi-technology CR issues are not fully modeled.
- Legacy `build-contribution-metrics.ts` still uses worklog-based allocation with Original Estimate only — not updated in this milestone per scope constraints.
- QA Task and other non-feature types are excluded implicitly via `isFeatureWork()` but not explicitly documented in sprint spec.

**Future improvements:**

- Unit tests for proportional allocation, solo vs shared tasks, and CR/RE estimate paths.
- Wire into `evaluateTask()` when orchestration milestone requires it.
- Replace `build-contribution-metrics.ts` with task-evaluation engine in a future dashboard integration sprint.
- Add `ContributionReason` enum if guard conditions are introduced.

**Technical debt:**

- `readFirstWorklogDeveloper` is a pragmatic heuristic for CR/RE scope totals; a technology-agnostic issue-level estimate resolver would be cleaner if Jira schema supports it.
- Minor overlap between `contribution-sources.ts` eligibility logic and `issue-types.ts` / `status-mapping.ts` config — intentional reuse of config, not duplication of status names.
