# Runtime Verification

Version: 1.0  
Status: Verification harness (Milestone 15 / Sprint 6A)  
Owner: TeamPulse

---

## Purpose

**Runtime Verification** reconciles engineering counts across layers using the real BannerBuzz Jira dataset (and the in-memory / warehouse artifacts produced from it).

This milestone adds **verification and reporting only**. It does not change analytics formulas, dashboard UI, PostgreSQL schema, repository interfaces, or live sync runtime behavior.

---

## Verification philosophy

1. **Same facts, four lenses.** Jira (source), EAW (warehouse model), Analytics (profiles), Dashboard (projection).
2. **Compare like with like.** Raw Jira worklog totals include all authors; EAW stores eligible developer worklogs with hours &gt; 0. Reports compare EAW to the **eligible** Jira subset.
3. **Dashboard vs Analytics.** Rebuild `DashboardData` from profiles with the existing aggregator and compare — no UI changes.
4. **Pure functions.** `runRuntimeVerification(input)` returns a report; it does not write DB state or mutate sync.
5. **Not a formula audit.** Engineering Score math is not re-derived; we check inputs coverage and dashboard projection fidelity.

---

## Verification levels

| Level | Module | What it checks |
|-------|--------|----------------|
| 1. Jira | `verify-jira-counts.ts` | Issue, worklog, eligible worklog, developer, technology, engineering hours |
| 2. EAW | `verify-eaw-counts.ts` | Same counts on `EngineeringWarehouseModel` vs Jira eligible baseline; batch counters |
| 3. Analytics | `verify-analytics-counts.ts` | Developer totals, technology totals, Engineering Score input coverage |
| 4. Dashboard | `verify-dashboard-counts.ts` | Engineering Score, top contributors, technologies vs analytics rebuild |

Entry: `runRuntimeVerification` → `VerificationReport` (`status`, `sections`, `summary`).

---

## Report shape

Compact summary (example):

```text
Verification Report

PASS

Jira

2478 Issues

7454 Worklogs

EAW

2478 Issues ✓

7454 Worklogs ✓

Analytics

Developer Totals ✓

Technology Totals ✓

Dashboard

Engineering Score ✓

Top Contributors ✓

Overall

PASS
```

Detailed dump: `formatDetailedVerificationReport(report)`.

---

## How to run (manual)

Call from a script, REPL, or future ops endpoint (not wired into `runAnalyticsSync` in this milestone):

```typescript
import { runRuntimeVerification } from "@/services/runtime-verification";

const report = runRuntimeVerification({
  jiraIssues,
  eawModel,
  developerProfiles,
  technologyProfiles,
  dashboardData,
  reportingPeriod,
});

console.log(report.summary);
```

Inputs are expected to come from the same sync session (or a recorded fixture).

---

## Future automated regression checks

1. After each successful sync (optional flag), run verification and log PASS/FAIL.
2. CI fixtures with known BannerBuzz snapshots (sanitized) asserting stable counts.
3. Alert when EAW↔eligible Jira drift exceeds thresholds.
4. Persist verification reports beside SyncBatch metadata (audit), without storing derived scores in EAW.

---

## Explicit non-goals (Milestone 15)

- Changing orchestrator runtime path
- Changing analytics formulas / engines
- Changing dashboard UI
- Changing PostgreSQL schema or repository interfaces
